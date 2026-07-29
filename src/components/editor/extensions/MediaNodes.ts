import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  AttachmentNodeView,
  AudioNodeView,
  VideoNodeView,
} from "../nodeViews/MediaNodeView";

const mediaAttributes = {
  fileId: {
    default: null,
    parseHTML: (element: HTMLElement) => {
      const value = element.getAttribute("data-file-id");
      return value ? Number(value) : null;
    },
  },
  src: { default: null },
  originalName: { default: null },
  mimeType: { default: null },
  size: { default: null },
};

export const AudioNode = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => mediaAttributes,
  parseHTML: () => [{ tag: "audio[data-file-id]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "audio",
    mergeAttributes(HTMLAttributes, {
      controls: "controls",
      "data-file-id": HTMLAttributes.fileId,
    }),
  ],
  addNodeView: () => ReactNodeViewRenderer(AudioNodeView),
});

export const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => mediaAttributes,
  parseHTML: () => [{ tag: "video[data-file-id]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "video",
    mergeAttributes(HTMLAttributes, {
      controls: "controls",
      "data-file-id": HTMLAttributes.fileId,
    }),
  ],
  addNodeView: () => ReactNodeViewRenderer(VideoNodeView),
});

const createAttachmentNode = (name: "pdfAttachment" | "fileAttachment") =>
  Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes: () => mediaAttributes,
    parseHTML: () => [{ tag: `a[data-editor-node="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: HTMLAttributes.src,
        target: "_blank",
        rel: "noreferrer",
        "data-file-id": HTMLAttributes.fileId,
        "data-editor-node": name,
      }),
      HTMLAttributes.originalName || "Mở tệp",
    ],
    addNodeView: () => ReactNodeViewRenderer(AttachmentNodeView),
  });

export const PdfAttachmentNode = createAttachmentNode("pdfAttachment");
export const FileAttachmentNode = createAttachmentNode("fileAttachment");
