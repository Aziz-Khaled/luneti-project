import { apiRequest, JsonRecord } from "./api";

export const clientsService = {
  me: () => apiRequest<JsonRecord>("clients/me"),
  updateMe: (input: JsonRecord) =>
    apiRequest<JsonRecord>("clients/me", { method: "PATCH", body: JSON.stringify(input) }),
  prescriptions: () => apiRequest<JsonRecord[]>("clients/me/prescriptions"),
  createPrescription: (input: JsonRecord) =>
    apiRequest<JsonRecord>("clients/me/prescriptions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  removePrescription: (id: string) =>
    apiRequest<JsonRecord>(`clients/me/prescriptions/${id}`, { method: "DELETE" }),
};
