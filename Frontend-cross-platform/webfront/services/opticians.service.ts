import { apiRequest, JsonRecord } from "./api";

export const opticiansService = {
  me: () => apiRequest<JsonRecord>("opticians/me"),
  updateMe: (input: JsonRecord) =>
    apiRequest<JsonRecord>("opticians/me", { method: "PATCH", body: JSON.stringify(input) }),
};
