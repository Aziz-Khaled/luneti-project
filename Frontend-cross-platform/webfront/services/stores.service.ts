import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const storesService = {
  list: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`stores${queryString({ page, limit: 20 })}`),
  find: (id: string) => apiRequest<JsonRecord>(`stores/${id}`),
  manage: (id: string) => apiRequest<JsonRecord>(`stores/${id}/manage`),
  create: (input: JsonRecord) =>
    apiRequest<JsonRecord>("stores", { method: "POST", body: JSON.stringify(input) }),
  verifyRne: (code_enregistrement: string) =>
    apiRequest<{ verified: true }>("stores/verify-rne", {
      method: "POST",
      body: JSON.stringify({ code_enregistrement }),
    }),
  update: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  uploadBrandingImage: (id: string, type: "logo" | "cover", file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<JsonRecord>(`stores/${id}/branding/${type}`, {
      method: "POST",
      body,
    });
  },
  archive: (id: string) =>
    apiRequest<JsonRecord>(`stores/${id}`, { method: "DELETE" }),
  members: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(`stores/${id}/members${queryString({ page, limit: 20 })}`),
  createEmployee: (
    id: string,
    input: {
      prenom: string;
      nom: string;
      email: string;
      temporaryPassword: string;
      role: string;
      preset: string;
      overrides: { code: string; allowed: boolean }[];
    },
  ) =>
    apiRequest<JsonRecord>(`stores/${id}/members`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMember: (storeId: string, memberId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  removeMember: (storeId: string, memberId: string) =>
    apiRequest<JsonRecord>(`stores/${storeId}/members/${memberId}`, { method: "DELETE" }),
  locations: (id: string) => apiRequest<JsonRecord[]>(`stores/${id}/locations`),
  locationTypes: (id: string) => apiRequest<JsonRecord[]>(`stores/${id}/locations/types`),
  createLocation: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}/locations`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createLocationType: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}/locations/types`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateLocation: (storeId: string, locationId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/locations/${locationId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateLocationType: (storeId: string, typeId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/locations/types/${typeId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  listings: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(`stores/${id}/listings${queryString({ page, limit: 20 })}`),
  createListing: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}/listings`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  addListingVariant: (storeId: string, listingId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/listings/${listingId}/variants`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateListingVariant: (
    storeId: string,
    listingId: string,
    variantId: string,
    input: JsonRecord,
  ) =>
    apiRequest<JsonRecord>(
      `stores/${storeId}/listings/${listingId}/variants/${variantId}`,
      { method: "PATCH", body: JSON.stringify(input) },
    ),
  dashboard: (id: string, filters: Record<string, string | undefined> = {}) =>
    apiRequest<JsonRecord>(`stores/${id}/dashboard${queryString({
      ...filters,
      to: filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)
        ? `${filters.to}T23:59:59.999Z`
        : filters.to,
    })}`),
  customers: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(`stores/${id}/customers${queryString({ page, limit: 20 })}`),
  customerOrders: (storeId: string, customerId: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/customers/${customerId}/orders${queryString({ page, limit: 20 })}`,
    ),
  appointments: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${id}/appointments${queryString({ page, limit: 20 })}`,
    ),
  updateAppointment: (storeId: string, appointmentId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/appointments/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
