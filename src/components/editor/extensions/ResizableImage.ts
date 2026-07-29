import Image from "@tiptap/extension-image";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fileId: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-file-id");
          return value ? Number(value) : null;
        },
        renderHTML: (attributes) =>
          attributes.fileId ? { "data-file-id": attributes.fileId } : {},
      },
      mimeType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mime-type"),
        renderHTML: (attributes) =>
          attributes.mimeType ? { "data-mime-type": attributes.mimeType } : {},
      },
      originalName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-original-name"),
        renderHTML: (attributes) =>
          attributes.originalName
            ? { "data-original-name": attributes.originalName }
            : {},
      },
    };
  },
}).configure({
  allowBase64: false,
  inline: false,
  resize: {
    enabled: true,
    directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
    minWidth: 120,
    minHeight: 80,
    alwaysPreserveAspectRatio: true,
  },
  HTMLAttributes: {
    class: "owlexa-editor-image",
    loading: "lazy",
  },
});
