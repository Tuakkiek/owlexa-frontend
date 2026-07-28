import type { UploadProgressItem } from "./types";

export const UploadProgress = ({
  items,
  onDismiss,
}: {
  items: UploadProgressItem[];
  onDismiss: (clientId: string) => void;
}) => {
  if (!items.length) return null;
  return (
    <div className="owlexa-upload-list" aria-live="polite">
      {items.map((item) => (
        <div key={item.clientId} className="owlexa-upload-item">
          <div className="owlexa-upload-row">
            <span className="owlexa-upload-spinner" aria-hidden="true" />
            <span title={item.name}>{item.name}</span>
            <strong>{item.status === "error" ? "Lỗi" : `${item.progress}%`}</strong>
            {item.status === "error" && (
              <button type="button" onClick={() => onDismiss(item.clientId)} aria-label="Đóng">
                ×
              </button>
            )}
          </div>
          {item.status === "uploading" ? (
            <div className="owlexa-upload-track">
              <div style={{ width: `${item.progress}%` }} />
            </div>
          ) : (
            <p>{item.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};
