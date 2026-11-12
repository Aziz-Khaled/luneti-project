import { apiRequest, JsonRecord } from "./api";

export const addressesService = {
  list: () => apiRequest<JsonRecord[]>("users/me/addresses"),
  find: (id: string) => apiRequest<JsonRecord>(`users/me/addresses/${id}`),
  create: (input: JsonRecord) =>
    apiRequest<JsonRecord>("users/me/addresses", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<JsonRecord>(`users/me/addresses/${id}`, { method: "DELETE" }),
};
