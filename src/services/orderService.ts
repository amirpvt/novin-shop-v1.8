import {
  getStoredOrders,
  saveStoredOrders,
  type StoredOrder,
} from "../storage";

export const orderService = {
  getAll(): StoredOrder[] {
    return getStoredOrders();
  },

  save(orders: StoredOrder[]) {
    saveStoredOrders(orders);
  },

  updateStatus(
    id: string,
    status: StoredOrder["status"]
  ) {
    const orders = getStoredOrders();

    const updated = orders.map((order) =>
      order.id === id
        ? { ...order, status }
        : order
    );

    saveStoredOrders(updated);

    return updated;
  },

  addWholesaleOrder(
    formData: any,
    items: any[]
  ) {
    const today = new Date().toLocaleDateString("fa-IR");

    const newOrder: StoredOrder = {
      id: "WHO-" + Date.now(),

      customerName: formData.companyName,

      customerPhone: formData.phone,

      productName: items
        .map(
          (item) =>
            `${item.name} (${item.quantity})`
        )
        .join(" | "),

      message:
        `نام رابط: ${formData.contactPerson}\n` +
        `آدرس: ${formData.address}\n` +
        `توضیحات: ${formData.description}`,

      status: "جدید",

      createdAt: today,
    };

    const updated = [
      newOrder,
      ...getStoredOrders(),
    ];

    saveStoredOrders(updated);

    return {
      order: newOrder,
      orders: updated,
    };
  },
};