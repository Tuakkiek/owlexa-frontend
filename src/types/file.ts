export type FileType = "IMAGE" | "AUDIO" | "VIDEO" | "PDF" | "ATTACHMENT";

export type FileStatus = "TEMPORARY" | "ACTIVE" | "ORPHANED" | "DELETED";

export interface FileMetadata {
  id: number;
  originalName: string;
  url: string;
  mimeType: string;
  type: FileType;
  extension: string;
  size: number;
  status?: FileStatus;
  createdAt?: string;
}
