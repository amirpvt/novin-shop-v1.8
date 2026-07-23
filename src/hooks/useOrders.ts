import { useState, useCallback } from "react";
import { ordersApi, wholesaleApi, type Order, type WholesaleRequest } from "../api/client";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesaleRequests, setWholesaleRequests] = useState<WholesaleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch orders (Admin) ────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch wholesale requests (Admin) ─────────────────────────────────

  const fetchWholesaleRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wholesaleApi.list();
      setWholesaleRequests(data);
    } catch (err) {
      console.error("Failed to fetch wholesale requests:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت درخواست‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Create retail order ──────────────────────────────────────────────

  const createOrder = useCallback(async (orderData: {
    name: string;
    phone: string;
    address?: string;
    message?: string;
    items: { product_id: number; quantity: number }[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const order = await ordersApi.create(orderData);
      setOrders((prev) => [order, ...prev]);
      return order;
    } catch (err) {
      console.error("Failed to create order:", err);
      setError(err instanceof Error ? err.message : "خطا در ثبت سفارش");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Create wholesale request ─────────────────────────────────────────

  const addWholesaleOrder = useCallback(async (
    formData: {
      companyName: string;
      contactPerson: string;
      phone: string;
      address?: string;
      description?: string;
    },
    items: { id: number; name: string; quantity: number }[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const request = await wholesaleApi.create({
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        phone: formData.phone,
        address: formData.address || "",
        description: formData.description || "",
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          notes: "",
        })),
      });
      setWholesaleRequests((prev) => [request, ...prev]);
      return request;
    } catch (err) {
      console.error("Failed to create wholesale request:", err);
      setError(err instanceof Error ? err.message : "خطا در ثبت درخواست");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Update wholesale status (Admin) ──────────────────────────────────

  const updateWholesaleStatus = useCallback(async (requestNumber: string, status: string) => {
    try {
      const updated = await wholesaleApi.updateStatus(requestNumber, status);
      setWholesaleRequests((prev) =>
        prev.map((req) =>
          req.request_number === requestNumber ? updated : req
        )
      );
      return updated;
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err;
    }
  }, []);

  // ─── Update orders (Admin - local state) ──────────────────────────────

  const updateOrders = useCallback((newOrders: Order[]) => {
    setOrders(newOrders);
  }, []);

  return {
    orders,
    wholesaleRequests,
    loading,
    error,

    fetchOrders,
    fetchWholesaleRequests,
    createOrder,
    addWholesaleOrder,
    updateWholesaleStatus,
    updateOrders,
  };
}