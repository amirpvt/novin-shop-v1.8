from abc import ABC, abstractmethod
from django.conf import settings
from .models import Payment, Order

class BasePaymentGateway(ABC):
    @abstractmethod
    def create_payment(self, payment: Payment):
        pass

    @abstractmethod
    def verify_payment(self, payment: Payment, authority: str):
        pass

class ZarinPalGateway(BasePaymentGateway):
    def create_payment(self, payment: Payment):
        # Implementation for ZarinPal request
        # authority = call_zarinpal_api(...)
        return {"status": "success", "url": f"https://zarinpal.com/pg/StartPay/mock_authority", "authority": "mock_authority"}

    def verify_payment(self, payment: Payment, authority: str):
        # Implementation for ZarinPal verification
        return {"status": "success", "ref_id": "12345678"}

class PaymentService:
    def __init__(self, gateway: BasePaymentGateway = None):
        self.gateway = gateway or ZarinPalGateway()

    def initiate_payment(self, order_id):
        order = Order.objects.get(id=order_id)
        payment = Payment.objects.create(
            order=order,
            payment_number=f"PAY-{order.order_number}",
            amount=order.total_amount,
            payment_status="PENDING"
        )
        
        gateway_res = self.gateway.create_payment(payment)
        if gateway_res["status"] == "success":
            payment.transaction_id = gateway_res["authority"]
            payment.save()
            return gateway_res["url"]
        return None

    def process_verification(self, payment_number, authority):
        payment = Payment.objects.get(payment_number=payment_number)
        verify_res = self.gateway.verify_payment(payment, authority)
        
        if verify_res["status"] == "success":
            payment.payment_status = "SUCCESS"
            payment.transaction_id = verify_res["ref_id"]
            payment.save()
            
            # Update order status
            order = payment.order
            order.order_status = "CONFIRMED"
            order.save()
            return True
        else:
            payment.payment_status = "FAILED"
            payment.save()
            return False
