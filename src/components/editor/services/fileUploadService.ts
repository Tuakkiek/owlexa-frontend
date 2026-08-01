import axiosClient from "../../../api/axiosClient";
import type { UploadedFile } from "../types";

export const ACCEPTED_EDITOR_FILES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
];

export const EDITOR_FILE_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,.mp3,.wav,.m4a,.ogg,.mp4,.webm,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar";

export const editorFileUploadService = {
  upload: async (
    file: File,
    onProgress: (progress: number) => void,
  ): Promise<UploadedFile> => {
    console.log("[editorFileUploadService] Uploading file to /api/files/upload:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axiosClient.post<UploadedFile>(
        "/api/files/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            const total = event.total ?? file.size;
            const progress = total > 0 ? Math.round((event.loaded * 100) / total) : 0;
            onProgress(Math.min(progress, 100));
          },
        },
      );
      console.log("[editorFileUploadService] Upload HTTP 200/201 response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[editorFileUploadService] Upload HTTP request failed:", error);
      throw error;
    }
  },
};
