import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const ordersService = {
  cart: () => apiRequest<JsonRecord>("cart"),
  addCartItem: (input: JsonRecord) =>
    apiRequest<JsonRecord>("cart/items", { method: "POST", body: JSON.stringify(input) }),
  removeCartItem: (id: string) =>
    apiRequest<JsonRecord>(`cart/items/${id}`, { method: "DELETE" }),
  clearCart: () => apiRequest<JsonRecord>("cart", { method: "DELETE" }),
  checkout: (input: JsonRecord) =>
    apiRequest<JsonRecord>("orders", { method: "POST", body: JSON.stringify(input) }),
  orders: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`orders${queryString({ page, limit: 20 })}`),
  order: (id: string) => apiRequest<JsonRecord>(`orders/${id}`),
  cancel: (id: string) => apiRequest<JsonRecord>(`orders/${id}/cancel`, { method: "POST" }),
  payments: (id: string) => apiRequest<JsonRecord[]>(`orders/${id}/payments`),
  refunds: (id: string) => apiRequest<JsonRecord[]>(`orders/${id}/refunds`),
};
