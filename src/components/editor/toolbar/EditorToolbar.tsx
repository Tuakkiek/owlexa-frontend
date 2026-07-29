import type { ChangeEvent, ReactNode } from "react";
import { useRef } from "react";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

const ToolbarButton = ({
  label,
  title,
  onClick,
  active = false,
  disabled = false,
}: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={`owlexa-toolbar-button ${active ? "is-active" : ""}`}
  >
    {label}
  </button>
);

const ToolbarGroup = ({ children }: { children: ReactNode }) => (
  <div className="owlexa-toolbar-group">{children}</div>
);

const UploadButton = ({
  label,
  title,
  accept,
  disabled,
  onFilesSelected,
}: {
  label: string;
  title: string;
  accept: string;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) onFilesSelected(files);
    event.target.value = "";
  };

  return (
    <>
      <ToolbarButton
        label={label}
        title={title}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={handleChange}
      />
    </>
  );
};

export const EditorToolbar = ({
  editor,
  disabled,
  onFilesSelected,
}: EditorToolbarProps) => {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập đường dẫn", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim(), target: "_blank" })
      .run();
  };

  return (
    <div className="owlexa-editor-toolbar" role="toolbar" aria-label="Công cụ soạn thảo">
      <ToolbarGroup>
        <select
          aria-label="Kiểu đoạn văn"
          title="Kiểu đoạn văn"
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "paragraph"
          }
          disabled={disabled}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "paragraph") {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 })
                .run();
            }
          }}
          className="owlexa-toolbar-select"
        >
          <option value="paragraph">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="B" title="In đậm" active={editor.isActive("bold")} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" title="In nghiêng" active={editor.isActive("italic")} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="U" title="Gạch chân" active={editor.isActive("underline")} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolbarButton label="S" title="Gạch ngang" active={editor.isActive("strike")} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <label className="owlexa-color-control" title="Màu chữ">
          A
          <input
            type="color"
            aria-label="Màu chữ"
            disabled={disabled}
            value={(editor.getAttributes("textStyle").color as string) || "#111827"}
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
          />
        </label>
        <label className="owlexa-color-control" title="Màu đánh dấu">
          ▰
          <input
            type="color"
            aria-label="Màu đánh dấu"
            disabled={disabled}
            value={(editor.getAttributes("highlight").color as string) || "#fef08a"}
            onChange={(event) =>
              editor.chain().focus().setHighlight({ color: event.target.value }).run()
            }
          />
        </label>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="• List" title="Danh sách dấu đầu dòng" active={editor.isActive("bulletList")} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="1. List" title="Danh sách đánh số" active={editor.isActive("orderedList")} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="☑" title="Danh sách công việc" active={editor.isActive("taskList")} disabled={disabled} onClick={() => editor.chain().focus().toggleTaskList().run()} />
        <ToolbarButton label="❝" title="Trích dẫn" active={editor.isActive("blockquote")} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton label="</>" title="Khối mã" active={editor.isActive("codeBlock")} disabled={disabled} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
        <ToolbarButton label="―" title="Đường phân cách" disabled={disabled} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <ToolbarButton label="🔗" title="Chèn hoặc sửa liên kết" active={editor.isActive("link")} disabled={disabled} onClick={setLink} />
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="⊞ Bảng" title="Chèn bảng 3 × 3" disabled={disabled} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        {editor.isActive("table") && (
          <>
            <ToolbarButton label="+ Hàng" title="Thêm hàng" disabled={disabled} onClick={() => editor.chain().focus().addRowAfter().run()} />
            <ToolbarButton label="+ Cột" title="Thêm cột" disabled={disabled} onClick={() => editor.chain().focus().addColumnAfter().run()} />
            <ToolbarButton label="− Hàng" title="Xóa hàng" disabled={disabled} onClick={() => editor.chain().focus().deleteRow().run()} />
            <ToolbarButton label="− Cột" title="Xóa cột" disabled={disabled} onClick={() => editor.chain().focus().deleteColumn().run()} />
            <ToolbarButton label="X Bảng" title="Xóa bảng" disabled={disabled} onClick={() => editor.chain().focus().deleteTable().run()} />
          </>
        )}
      </ToolbarGroup>

      <ToolbarGroup>
        <UploadButton label="Ảnh" title="Tải ảnh" accept="image/png,image/jpeg,image/gif,image/webp" disabled={disabled} onFilesSelected={onFilesSelected} />
        <UploadButton label="Audio" title="Tải audio" accept=".mp3,.wav,.m4a,.ogg,audio/*" disabled={disabled} onFilesSelected={onFilesSelected} />
        <UploadButton label="Video" title="Tải video" accept=".mp4,.webm,video/mp4,video/webm" disabled={disabled} onFilesSelected={onFilesSelected} />
        <UploadButton label="PDF" title="Tải PDF" accept="application/pdf,.pdf" disabled={disabled} onFilesSelected={onFilesSelected} />
        <UploadButton label="File" title="Tải file đính kèm" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" disabled={disabled} onFilesSelected={onFilesSelected} />
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="↶" title="Hoàn tác" disabled={disabled || !editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="↷" title="Làm lại" disabled={disabled || !editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()} />
      </ToolbarGroup>
    </div>
  );
};
