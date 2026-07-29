import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

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
      <span aria-hidden="true">♪</span>
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
      <span aria-hidden="true">▶</span>
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
      <div className="owlexa-attachment-icon" aria-hidden="true">
        {isPdf ? "PDF" : "FILE"}
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
