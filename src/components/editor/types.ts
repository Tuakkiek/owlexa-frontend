import type { JSONContent } from "@tiptap/core";
import type { FileMetadata, FileType } from "../../types/file";

export type EditorDocument = JSONContent;

export type UploadedFileType = FileType;

export type UploadedFile = FileMetadata;

export interface UploadProgressItem {
  clientId: string;
  name: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
}

export const EMPTY_EDITOR_DOCUMENT: EditorDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const isEmptyEditorDocument = (document: EditorDocument): boolean => {
  const content = document.content ?? [];
  if (content.length === 0) return true;
  return !hasMeaningfulNode(document);
};

const hasMeaningfulNode = (node: JSONContent): boolean => {
  if (node.type === "text" && Boolean(node.text?.trim())) return true;
  if (["image", "audio", "video", "pdfAttachment", "fileAttachment", "table"].includes(node.type ?? "")) {
    return true;
  }
  return (node.content ?? []).some(hasMeaningfulNode);
};

export const editorDocumentToPlainText = (document: EditorDocument): string => {
  const values: string[] = [];
  const visit = (node: JSONContent) => {
    if (node.type === "text" && node.text) values.push(node.text);
    node.content?.forEach(visit);
  };
  visit(document);
  return values.join(" ").replace(/\s+/g, " ").trim();
};
