import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const featuresService = {
  appointments: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`appointments/me${queryString({ page, limit: 20 })}`),
  createAppointment: (input: JsonRecord) =>
    apiRequest<JsonRecord>("appointments", { method: "POST", body: JSON.stringify(input) }),
  cancelAppointment: (id: string) =>
    apiRequest<JsonRecord>(`appointments/${id}/cancel`, { method: "POST" }),
  notifications: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`notifications${queryString({ page, limit: 20 })}`),
  unreadCount: () => apiRequest<{ count: number }>("notifications/unread-count"),
  markNotificationRead: (id: string) =>
    apiRequest<JsonRecord>(`notifications/${id}/read`, { method: "POST" }),
  notificationPreferences: () => apiRequest<JsonRecord[]>("notifications/preferences"),
  updateNotificationPreference: (input: JsonRecord) =>
    apiRequest<JsonRecord>("notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  tryOnPolicy: () => apiRequest<JsonRecord>("virtual-try-on/consent"),
  tryOnSessions: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`virtual-try-on/sessions${queryString({ page, limit: 20 })}`),
  createTryOn: (input: JsonRecord) =>
    apiRequest<JsonRecord>("virtual-try-on/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  reviewsForProduct: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `products/${id}/reviews${queryString({ page, limit: 20 })}`,
    ),
  reviewsForStore: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${id}/reviews${queryString({ page, limit: 20 })}`,
    ),
  createProductReview: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`products/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createStoreReview: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  favorites: (kind: "products" | "stores", page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `users/me/favorites/${kind}${queryString({ page, limit: 20 })}`,
    ),
  favorite: (kind: "products" | "stores", id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/${kind}/${id}`, { method: "POST" }),
  unfavorite: (kind: "products" | "stores", id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/${kind}/${id}`, { method: "DELETE" }),
  markAllNotificationsRead: () =>
    apiRequest<JsonRecord>("notifications/read-all", { method: "POST" }),
};
