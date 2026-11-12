import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export const inventoryService = {
  list: (storeId: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/inventory${queryString({ page, limit: 20 })}`,
    ),
  find: (storeId: string, stockId: string) =>
    apiRequest<JsonRecord>(`stores/${storeId}/inventory/${stockId}`),
  create: (storeId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/inventory`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  scanReference: async (storeId: string, image: File) => {
    const formData = new FormData();
    formData.append("image", await resizeReferenceImage(image));
    const result = await apiRequest<{
      reference: { reference_brute: string };
    }>(`stores/${storeId}/inventory/scan-reference`, {
      method: "POST",
      body: formData,
    });
    return result.reference.reference_brute;
  },
  update: (storeId: string, stockId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/inventory/${stockId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  movements: (storeId: string, stockId: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${storeId}/inventory/${stockId}/movements${queryString({
        page,
        limit: 20,
      })}`,
    ),
  createMovement: (storeId: string, stockId: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${storeId}/inventory/${stockId}/movements`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

async function resizeReferenceImage(image: File): Promise<File> {
    if (typeof createImageBitmap !== "function") return image;

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(image);
    } catch {
      return image;
    }

    try {
      const scale = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Impossible de préparer la photo.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Impossible de préparer la photo.")),
          "image/jpeg",
          0.92,
        );
      });
      return new File([blob], "capture.jpg", { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
}
