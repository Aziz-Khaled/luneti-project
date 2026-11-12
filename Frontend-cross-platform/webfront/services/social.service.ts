import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const socialService = {
  feed: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`social/feed${queryString({ page, limit: 20 })}`),
  myPosts: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`social/me/publications${queryString({ page, limit: 20 })}`),
  createPost: (input: JsonRecord) =>
    apiRequest<JsonRecord>("social/publications", { method: "POST", body: JSON.stringify(input) }),
  updatePost: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`social/publications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deletePost: (id: string) =>
    apiRequest<JsonRecord>(`social/publications/${id}`, { method: "DELETE" }),
  comments: (postId: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `social/publications/${postId}/comments${queryString({ page, limit: 20 })}`,
    ),
  addComment: (postId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`social/publications/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteComment: (id: string) =>
    apiRequest<JsonRecord>(`social/comments/${id}`, { method: "DELETE" }),
  like: (postId: string) =>
    apiRequest<JsonRecord>(`social/publications/${postId}/like`, { method: "POST" }),
  unlike: (postId: string) =>
    apiRequest<JsonRecord>(`social/publications/${postId}/like`, { method: "DELETE" }),
  repost: (postId: string, input: JsonRecord = {}) =>
    apiRequest<JsonRecord>(`social/publications/${postId}/repost`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  unrepost: (postId: string) =>
    apiRequest<JsonRecord>(`social/publications/${postId}/repost`, { method: "DELETE" }),
  followStore: (storeId: string) =>
    apiRequest<JsonRecord>(`social/stores/${storeId}/follow`, { method: "POST" }),
  unfollowStore: (storeId: string) =>
    apiRequest<JsonRecord>(`social/stores/${storeId}/follow`, { method: "DELETE" }),
};
