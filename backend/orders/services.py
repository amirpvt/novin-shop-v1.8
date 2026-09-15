"""
Zarinpal Payment Gateway - production implementation.
Flow:
Create -> Redirect -> Callback -> Verify -> Transaction ID -> Order = PAID_PENDING_REVIEW

Production rule:
NO MOCK IN PRODUCTION. Network/configuration/gateway errors fail closed and never confirm orders.
"""
import logging
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

import requests
from django.conf import settings
from django.db import transaction

from .models import Payment, Order

logger = logging.getLogger(__name__)

DUMMY_MERCHANT_ID = "00000000-0000-0000-0000-000000000000"


class BasePaymentGateway:
    def create_payment(self, payment: Payment, callback_url: str, description: str = ""):
        raise NotImplementedError

    def verify_payment(self, payment: Payment, authority: str):
        raise NotImplementedError


class ZarinPalGateway(BasePaymentGateway):
    """
    زرین‌پال v4
    - Sandbox: https://sandbox.zarinpal.com/pg/v4/payment/request.json
    - Production: https://payment.zarinpal.com/pg/v4/payment/request.json
    """

    def __init__(self):
        self.merchant_id = getattr(settings, "ZARINPAL_MERCHANT_ID", "")
        self.sandbox = bool(getattr(settings, "ZARINPAL_SANDBOX", True))
        self.timeout = int(getattr(settings, "ZARINPAL_REQUEST_TIMEOUT", 10))
        self.base_url = "https://sandbox.zarinpal.com" if self.sandbox else "https://payment.zarinpal.com"
        self.currency = getattr(settings, "ZARINPAL_CURRENCY", "IRT")
        self.request_url = f"{self.base_url}/pg/v4/payment/request.json"
        self.verify_url = f"{self.base_url}/pg/v4/payment/verify.json"
        self.startpay_url = f"{self.base_url}/pg/StartPay/"

    @property
    def production_mode(self) -> bool:
        return not bool(getattr(settings, "DEBUG", False)) and not self.sandbox

    def _validate_gateway_config(self):
        if not self.merchant_id:
            return "ZARINPAL_MERCHANT_ID تنظیم نشده است."
        if self.production_mode and self.merchant_id == DUMMY_MERCHANT_ID:
            return "Merchant ID تستی در Production مجاز نیست."
        return None

    def create_payment(self, payment: Payment, callback_url: str, description: str = ""):
        """Create payment request and return StartPay URL."""
        config_error = self._validate_gateway_config()
        if config_error:
            logger.error("Zarinpal configuration error: %s", config_error)
            return {"status": "failed", "message": config_error}

        payload = {
            "merchant_id": self.merchant_id,
            "amount": int(payment.amount),
            "currency": self.currency,
            "description": description or f"پرداخت سفارش {payment.order.order_number} - نوین شاپ",
            "callback_url": callback_url,
            "metadata": {
                "mobile": payment.order.phone,
                "order_id": payment.order.order_number,
            },
        }

        logger.info(
            "Zarinpal create request: merchant=%s... amount=%s callback=%s sandbox=%s",
            self.merchant_id[:8],
            payment.amount,
            callback_url,
            self.sandbox,
        )

        try:
            response = requests.post(self.request_url, json=payload, headers={"accept": "application/json", "content-type": "application/json"}, timeout=self.timeout)
        except requests.exceptions.RequestException as exc:
            logger.error("Zarinpal create network error: %s", exc, exc_info=True)
            message = "خطا در ارتباط با زرین‌پال"
            if getattr(settings, "DEBUG", False):
                message = f"{message}: {exc}"
            return {"status": "failed", "message": message}

        try:
            data = response.json()
            logger.info("Zarinpal create response: %s", data)
        except ValueError as exc:
            logger.error("Invalid Zarinpal create response: status=%s body=%s", response.status_code, response.text[:500], exc_info=True)
            if not response.ok:
                return {"status": "failed", "message": f"خطای HTTP زرین‌پال: {response.status_code}"}
            return {"status": "failed", "message": "پاسخ نامعتبر از زرین‌پال"}

        gateway_data = data.get("data") or {}
        if gateway_data.get("code") == 100 and gateway_data.get("authority"):
            authority = gateway_data["authority"]
            return {
                "status": "success",
                "url": f"{self.startpay_url}{authority}",
                "authority": authority,
            }

        errors = data.get("errors") or gateway_data or data
        logger.error("Zarinpal create failed: %s", errors)
        return {"status": "failed", "message": str(errors)}

    def verify_payment(self, payment: Payment, authority: str):
        """Verify payment after Zarinpal callback."""
        if authority.startswith("mock_"):
            logger.error("Mock authority rejected: %s", authority)
            return {"status": "failed", "message": "Mock payment is not allowed."}

        config_error = self._validate_gateway_config()
        if config_error:
            logger.error("Zarinpal configuration error on verify: %s", config_error)
            return {"status": "failed", "message": config_error}

        payload = {
            "merchant_id": self.merchant_id,
            "amount": int(payment.amount),
            "authority": authority,
        }

        try:
            response = requests.post(self.verify_url, json=payload, headers={"accept": "application/json", "content-type": "application/json"}, timeout=self.timeout)
        except requests.exceptions.RequestException as exc:
            logger.error("Zarinpal verify network error: %s", exc, exc_info=True)
            message = "خطا در تایید پرداخت زرین‌پال"
            if getattr(settings, "DEBUG", False):
                message = f"{message}: {exc}"
            return {"status": "failed", "message": message}

        try:
            data = response.json()
            logger.info("Zarinpal verify response: %s", data)
        except ValueError as exc:
            logger.error("Invalid Zarinpal verify response: status=%s body=%s", response.status_code, response.text[:500], exc_info=True)
            if not response.ok:
                return {"status": "failed", "message": f"خطای HTTP تایید زرین‌پال: {response.status_code}"}
            return {"status": "failed", "message": "پاسخ تایید نامعتبر از زرین‌پال"}

        gateway_data = data.get("data") or {}
        if gateway_data.get("code") in [100, 101]:
            # 100 = verified, 101 = already verified
            return {
                "status": "success",
                "ref_id": str(gateway_data.get("ref_id") or authority),
                "card_pan": gateway_data.get("card_pan"),
                "card_hash": gateway_data.get("card_hash"),
            }

        logger.error("Zarinpal verify failed: %s", data)
        return {"status": "failed", "message": str(data.get("errors") or data)}


class PaymentService:
    def __init__(self, gateway: BasePaymentGateway = None):
        self.gateway = gateway or ZarinPalGateway()

    def _callback_with_payment_params(self, callback_url: str, order: Order, payment: Payment) -> str:
        parsed = urlparse(callback_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.setdefault("order", order.order_number)
        query.setdefault("payment_number", payment.payment_number)
        return urlunparse(parsed._replace(query=urlencode(query)))

    def initiate_payment_detail(self, order_id, callback_url: str = None):
        """Start payment for an order and return structured gateway data."""
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            logger.error("Order %s not found", order_id)
            return {"status": "failed", "message": "سفارش یافت نشد"}

        if order.order_status == "CANCELLED":
            return {"status": "failed", "message": "امکان پرداخت سفارش لغوشده وجود ندارد"}
        if int(order.total_amount or 0) <= 0:
            return {"status": "failed", "message": "مبلغ سفارش برای پرداخت معتبر نیست"}

        existing_success = Payment.objects.filter(order=order, payment_status="SUCCESS").first()
        if existing_success:
            logger.info("Order %s already has successful payment", order.order_number)
            return {
                "status": "already_paid",
                "message": "این سفارش قبلاً با موفقیت پرداخت شده است",
                "payment_number": existing_success.payment_number,
                "transaction_id": existing_success.transaction_id,
                "order_number": order.order_number,
            }

        callback = callback_url or f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/payment/verify"

        payment, created = Payment.objects.get_or_create(
            payment_number=f"PAY-{order.order_number}",
            defaults={
                "order": order,
                "amount": order.total_amount,
                "payment_status": "PENDING",
            },
        )
        if not created:
            payment.order = order
            payment.amount = order.total_amount
            payment.payment_status = "PENDING"
            payment.transaction_id = None
            payment.save(update_fields=["order", "amount", "payment_status", "transaction_id"])

        callback = self._callback_with_payment_params(callback, order, payment)
        description = f"نوین شاپ - سفارش {order.order_number} - {order.name}"
        gateway_res = self.gateway.create_payment(payment, callback_url=callback, description=description)

        if gateway_res.get("status") == "success":
            # Before verify, transaction_id temporarily stores Zarinpal Authority.
            payment.transaction_id = gateway_res["authority"]
            payment.save(update_fields=["transaction_id"])
            return {
                "status": "success",
                "payment_url": gateway_res["url"],
                "authority": gateway_res["authority"],
                "payment_number": payment.payment_number,
                "order_number": order.order_number,
                "amount": payment.amount,
            }

        payment.payment_status = "FAILED"
        payment.save(update_fields=["payment_status"])
        logger.error("Payment initiation failed for order %s: %s", order.order_number, gateway_res)
        return {"status": "failed", "message": gateway_res.get("message") or "خطا در ایجاد پرداخت"}

    def initiate_payment(self, order_id, callback_url: str = None):
        """Backward-compatible wrapper returning only redirect URL."""
        result = self.initiate_payment_detail(order_id, callback_url=callback_url)
        return result.get("payment_url") if result.get("status") == "success" else None

    @transaction.atomic
    def mark_cancelled(self, payment_number):
        try:
            payment = Payment.objects.select_for_update().get(payment_number=payment_number)
        except Payment.DoesNotExist:
            return {"status": "failed", "message": "پرداخت یافت نشد"}
        payment.payment_status = "FAILED"
        payment.save(update_fields=["payment_status"])
        return {"status": "cancelled", "payment_number": payment.payment_number}

    @transaction.atomic
    def process_verification(self, payment_number, authority):
        """Verify callback and confirm order only after successful gateway verification."""
        try:
            payment = Payment.objects.select_for_update().select_related("order").get(payment_number=payment_number)
        except Payment.DoesNotExist:
            logger.error("Payment %s not found", payment_number)
            return {"status": "failed", "message": "پرداخت یافت نشد"}

        if payment.payment_status == "SUCCESS":
            return {
                "status": "success",
                "payment_number": payment.payment_number,
                "transaction_id": payment.transaction_id,
                "order_number": payment.order.order_number,
            }

        if payment.transaction_id and payment.transaction_id != authority:
            logger.error("Authority mismatch for %s: expected=%s got=%s", payment_number, payment.transaction_id, authority)
            return {"status": "failed", "payment_number": payment.payment_number, "message": "Authority پرداخت با سفارش همخوانی ندارد"}

        verify_res = self.gateway.verify_payment(payment, authority)

        if verify_res.get("status") == "success": 
            transaction_id = verify_res.get("ref_id") or authority
            payment.payment_status = "SUCCESS"
            payment.transaction_id = transaction_id
            payment.save(update_fields=["payment_status", "transaction_id"])

            order = payment.order
            order.order_status = "PAID_PENDING_REVIEW"
            order.save(update_fields=["order_status"])

            logger.info(
                "Payment %s verified, transaction_id=%s, order %s confirmed",
                payment_number,
                transaction_id,
                order.order_number,
            )
            return {
                "status": "success",
                "payment_number": payment.payment_number,
                "transaction_id": transaction_id,
                "order_number": order.order_number,
            }

        payment.payment_status = "FAILED"
        payment.save(update_fields=["payment_status"])
        logger.error("Payment verification failed for %s: %s", payment_number, verify_res)
        return {"status": "failed", "payment_number": payment.payment_number, "message": verify_res.get("message")}
