import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const productsService = {
  list: (page = 1, q?: string, type?: string) =>
    apiRequest<Page<JsonRecord>>(
      `products${queryString({ page, limit: 20, q, type })}`,
    ),
  find: (id: string) => apiRequest<JsonRecord>(`products/${id}`),
  variants: (id: string) => apiRequest<JsonRecord[]>(`products/${id}/variants`),
};
