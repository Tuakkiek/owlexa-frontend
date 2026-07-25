import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2 ${className}`,
        placeholder: placeholder || ''
      },
    },
  });

  // Keep editor content in sync with external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-surface-border rounded-input bg-white overflow-hidden focus-within:border-primary ${className}`}>
      <div className="flex flex-wrap gap-1 border-b border-surface-border bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Numbered List
        </button>
      </div>
      <EditorContent editor={editor} className="cursor-text bg-white" />
    </div>
  );
}
