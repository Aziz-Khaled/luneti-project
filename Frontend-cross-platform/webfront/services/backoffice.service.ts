import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

type Filters = Record<string, string | number | undefined>;

export const backofficeService = {
  orders: (storeId: string, page = 1, filters: Filters = {}) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/orders${queryString({
        page,
        limit: 20,
        search: typeof filters.search === "string" ? filters.search : undefined,
        status: typeof filters.status === "string" ? filters.status : undefined,
        from: dateStart(filters.from),
        to: dateEnd(filters.to),
      })}`,
    ),
  order: (storeId: string, orderId: string) =>
    apiRequest<JsonRecord>(`stores/${storeId}/orders/${orderId}`),
  updateOrderStatus: (storeId: string, orderId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  transactions: (storeId: string, page = 1, filters: Filters = {}) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/transactions${queryString({
        page,
        limit: 20,
        search: typeof filters.search === "string" ? filters.search : undefined,
        status: typeof filters.status === "string" ? filters.status : undefined,
        provider: typeof filters.provider === "string" ? filters.provider : undefined,
        from: dateStart(filters.from),
        to: dateEnd(filters.to),
      })}`,
    ),
  activity: (storeId: string, page = 1, filters: Filters = {}) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/activity${queryString({
        page,
        limit: 20,
        search: typeof filters.search === "string" ? filters.search : undefined,
        from: dateStart(filters.from),
        to: dateEnd(filters.to),
        actorId: typeof filters.actorId === "string" ? filters.actorId : undefined,
        action: typeof filters.action === "string" ? filters.action : undefined,
        entityType: typeof filters.entityType === "string" ? filters.entityType : undefined,
      })}`,
    ),
  activityDetails: (storeId: string, activityId: string) =>
    apiRequest<JsonRecord>(`stores/${storeId}/activity/${activityId}`),
};

function dateStart(value: string | number | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00.000Z`
    : typeof value === "string"
      ? value
      : undefined;
}

function dateEnd(value: string | number | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59:59.999Z`
    : typeof value === "string"
      ? value
      : undefined;
}
