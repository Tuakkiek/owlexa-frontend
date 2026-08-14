import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Music, Play, FileText, Paperclip } from "lucide-react";

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const AudioNodeView = ({ node, selected }: NodeViewProps) => (
  <NodeViewWrapper
    className={`owlexa-media-node ${selected ? "is-selected" : ""}`}
    data-drag-handle
  >
    <div className="owlexa-media-heading">
      <Music className="h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
      <span>{node.attrs.originalName || "Audio"}</span>
    </div>
    <audio controls preload="metadata" src={node.attrs.src} contentEditable={false}>
      Trình duyệt không hỗ trợ audio.
    </audio>
  </NodeViewWrapper>
);

export const VideoNodeView = ({ node, selected }: NodeViewProps) => (
  <NodeViewWrapper
    className={`owlexa-media-node ${selected ? "is-selected" : ""}`}
    data-drag-handle
  >
    <div className="owlexa-media-heading">
      <Play className="h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
      <span>{node.attrs.originalName || "Video"}</span>
    </div>
    <video controls preload="metadata" src={node.attrs.src} contentEditable={false}>
      Trình duyệt không hỗ trợ video.
    </video>
  </NodeViewWrapper>
);

export const AttachmentNodeView = ({ node, selected }: NodeViewProps) => {
  const isPdf = node.type.name === "pdfAttachment";
  return (
    <NodeViewWrapper
      className={`owlexa-attachment-node ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      <div className="owlexa-attachment-icon flex items-center justify-center" aria-hidden="true">
        {isPdf ? <FileText className="h-4 w-4 text-red-500" /> : <Paperclip className="h-4 w-4 text-gray-500" />}
      </div>
      <div className="owlexa-attachment-info">
        <strong>{node.attrs.originalName || (isPdf ? "Tài liệu PDF" : "Tệp đính kèm")}</strong>
        <span>
          {node.attrs.mimeType}
          {node.attrs.size ? ` · ${formatSize(node.attrs.size)}` : ""}
        </span>
      </div>
      <a href={node.attrs.src} target="_blank" rel="noreferrer" contentEditable={false}>
        Mở tệp
      </a>
    </NodeViewWrapper>
  );
};
