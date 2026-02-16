import { useState, useCallback } from "react";

export default function FileUpload({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const validateFile = (file) => {
    const isPdf =
      file?.type === "application/pdf" ||
      file?.name?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      alert("PDF only during beta. Word support coming soon.");
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return false;
    }

    return true;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      if (!validateFile(file)) return;

      setSelectedFile(file);
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!validateFile(file)) {
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  return (
    <div className="file-upload-container">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <label
          htmlFor="file-upload"
          className={`file-upload-area ${dragActive ? "drag-active" : ""}`}
        >
          <div className="upload-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {selectedFile ? (
            <div className="file-selected">
              <p className="file-name">📄 {selectedFile.name}</p>
              <p className="file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="file-change">Click or drag to change file</p>
            </div>
          ) : (
            <div className="file-prompt">
              <p className="prompt-main">
                Drag dissertation here or click to browse
              </p>
              <p className="prompt-sub">PDF only • Max 50MB • Full dissertations welcome</p>
            </div>
          )}
        </label>
      </form>

      <style jsx>{`
        .file-upload-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .file-upload-area {
          width: 100%;
          max-width: 720px;
          min-height: 220px;
          border: 2px dashed #c7d2fe;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-align: center;
          cursor: pointer;
          background: #fafaff;
          transition: all 0.2s ease;
        }

        .file-upload-area:hover {
          background: #f3f4ff;
          border-color: #6366f1;
        }

        .drag-active {
          background: #eef2ff;
          border-color: #4f46e5;
        }

        .upload-icon {
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-prompt .prompt-main {
          font-size: 1.05rem;
          font-weight: 600;
          color: #0f172a;
        }

        .file-prompt .prompt-sub {
          font-size: 0.9rem;
          color: #64748b;
        }

        .file-selected .file-name {
          font-weight: 600;
          color: #0f172a;
        }

        .file-selected .file-size {
          font-size: 0.85rem;
          color: #64748b;
        }

        .file-change {
          margin-top: 0.25rem;
          font-size: 0.85rem;
          color: #4f46e5;
        }
      `}</style>
    </div>
  );
}