import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import FileHandler from "@tiptap/extension-file-handler";
import { ResizableImage } from "./extensions/ResizableImage";
import {
  AudioNode,
  FileAttachmentNode,
  PdfAttachmentNode,
  VideoNode,
} from "./extensions/MediaNodes";
import { editorFileUploadService } from "./services/fileUploadService";
import { EditorToolbar } from "./toolbar/EditorToolbar";
import { UploadProgress } from "./UploadProgress";
import type {
  EditorDocument,
  UploadedFile,
  UploadProgressItem,
} from "./types";
import { EMPTY_EDITOR_DOCUMENT } from "./types";
import "./editor.css";

interface RichTextEditorProps {
  value: EditorDocument;
  onChange?: (value: EditorDocument) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: number;
}

const toEditorNode = (file: UploadedFile): JSONContent => {
  const commonAttrs = {
    fileId: file.id,
    src: file.url,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
  };
  switch (file.type) {
    case "IMAGE":
      return {
        type: "image",
        attrs: {
          ...commonAttrs,
          alt: file.originalName,
          title: file.originalName,
        },
      };
    case "AUDIO":
      return { type: "audio", attrs: commonAttrs };
    case "VIDEO":
      return { type: "video", attrs: commonAttrs };
    case "PDF":
      return { type: "pdfAttachment", attrs: commonAttrs };
    default:
      return { type: "fileAttachment", attrs: commonAttrs };
  }
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
  editable = true,
  minHeight = 260,
}: RichTextEditorProps) => {
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);

  const updateUpload = useCallback(
    (clientId: string, patch: Partial<UploadProgressItem>) => {
      setUploads((current) =>
        current.map((item) =>
          item.clientId === clientId ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const uploadFiles = useCallback(
    async (editor: Editor, files: File[], position?: number) => {
      let insertionPosition = position;
      for (const file of files) {
        const clientId = crypto.randomUUID();
        setUploads((current) => [
          ...current,
          {
            clientId,
            name: file.name,
            progress: 0,
            status: "uploading",
          },
        ]);
        try {
          const uploaded = await editorFileUploadService.upload(file, (progress) =>
            updateUpload(clientId, { progress }),
          );
          const node = toEditorNode(uploaded);
          if (typeof insertionPosition === "number") {
            editor.chain().focus().insertContentAt(insertionPosition, node).run();
            insertionPosition += 1;
          } else {
            editor.chain().focus().insertContent(node).run();
          }
          updateUpload(clientId, { progress: 100 });
          window.setTimeout(() => {
            setUploads((current) =>
              current.filter((item) => item.clientId !== clientId),
            );
          }, 500);
        } catch (error: any) {
          updateUpload(clientId, {
            status: "error",
            error:
              error?.response?.data?.message ??
              `Không thể tải lên ${file.name}.`,
          });
        }
      }
    },
    [updateUpload],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: {
          resizable: true,
          allowTableNodeSelection: true,
        },
      }),
      ResizableImage,
      AudioNode,
      VideoNode,
      PdfAttachmentNode,
      FileAttachmentNode,
      Placeholder.configure({ placeholder }),
      FileHandler.configure({
        consumePasteEvent: true,
        onPaste: (editor, files) => {
          void uploadFiles(editor, files);
        },
        onDrop: (editor, files, position) => {
          void uploadFiles(editor, files, position);
        },
      }),
    ],
    [placeholder, uploadFiles],
  );

  const editor = useEditor(
    {
      extensions,
      content: value ?? EMPTY_EDITOR_DOCUMENT,
      editable,
      onUpdate: ({ editor: currentEditor }) => {
        onChange?.(currentEditor.getJSON());
      },
      editorProps: {
        attributes: {
          class: "owlexa-prosemirror",
          role: "textbox",
          "aria-multiline": "true",
        },
      },
    },
    [extensions],
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(value ?? EMPTY_EDITOR_DOCUMENT);
    const current = JSON.stringify(editor.getJSON());
    if (incoming !== current) {
      editor.commands.setContent(value ?? EMPTY_EDITOR_DOCUMENT, {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className={`owlexa-editor-shell is-loading ${className}`}>
        Đang khởi tạo trình soạn thảo...
      </div>
    );
  }

  const isUploading = uploads.some((item) => item.status === "uploading");

  return (
    <div
      className={`owlexa-editor-shell ${editable ? "" : "is-readonly"} ${className}`}
      style={{ "--owlexa-editor-min-height": `${minHeight}px` } as React.CSSProperties}
    >
      {editable && (
        <EditorToolbar
          editor={editor}
          disabled={false}
          onFilesSelected={(files) => void uploadFiles(editor, files)}
        />
      )}
      {editable && (
        <UploadProgress
          items={uploads}
          onDismiss={(clientId) =>
            setUploads((current) =>
              current.filter((item) => item.clientId !== clientId),
            )
          }
        />
      )}
      <div className={`owlexa-editor-content ${isUploading ? "is-uploading" : ""}`}>
        <EditorContent editor={editor} />
        {editable && (
          <div className="owlexa-editor-drop-hint">
            Kéo thả hoặc dán ảnh/tệp trực tiếp vào nội dung
          </div>
        )}
      </div>
    </div>
  );
};

export const RichTextRenderer = ({
  value,
  className = "",
}: {
  value: EditorDocument;
  className?: string;
}) => (
  <RichTextEditor
    value={value}
    editable={false}
    minHeight={0}
    className={className}
  />
);
