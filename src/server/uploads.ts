import { createServerFn } from "@tanstack/react-start";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "application-uploads";

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { fileName: string; contentType: string; base64Data: string }) =>
      input
  )
  .handler(async ({ data }) => {
    const store = getStore(STORE_NAME);
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${data.fileName}`;
    const buffer = Buffer.from(data.base64Data, "base64");
    await store.set(key, buffer, {
      metadata: {
        contentType: data.contentType,
        originalName: data.fileName,
      },
    });
    return { key, fileName: data.fileName, contentType: data.contentType };
  });

export const getFileDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    const store = getStore(STORE_NAME);
    const meta = await store.getMetadata(data.key);
    if (!meta) return null;
    const blob = await store.get(data.key, { type: "arrayBuffer" });
    if (!blob) return null;
    const base64 = Buffer.from(blob).toString("base64");
    return {
      base64Data: base64,
      contentType: meta.metadata.contentType || "application/octet-stream",
      fileName: meta.metadata.originalName || data.key,
    };
  });
