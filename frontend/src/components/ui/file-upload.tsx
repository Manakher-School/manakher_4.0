"use client";

import { useState, useRef } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  label: string;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  onFileChange: (file: File | null) => void;
  fileName?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function FileUpload({
  label,
  acceptedTypes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  maxSizeMB = 10,
  onFileChange,
  fileName,
  disabled = false,
  required,
}: FileUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      onFileChange(null);
      return;
    }

    // Validate file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      setFileError(`Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`);
      onFileChange(null);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError(`File too large. Maximum size: ${maxSizeMB}MB`);
      onFileChange(null);
      return;
    }

    setFileError(null);
    onFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) {
      onFileChange(null);
      return;
    }

    // Validate file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      setFileError(`Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`);
      onFileChange(null);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError(`File too large. Maximum size: ${maxSizeMB}MB`);
      onFileChange(null);
      return;
    }

    setFileError(null);
    onFileChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[var(--color-ink)]">
        {label}
        {required === true && <span className="text-[var(--color-danger)] ms-1">*</span>}
        {required === false && <span className="text-xs text-[var(--color-ink-secondary)] ms-1">(optional)</span>}
      </label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-between rounded-[var(--radius-md)] border-2 border-[var(--color-border)] 
        bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-ink)] 
        hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer
        ${isHovering ? "border-[var(--color-accent)] bg-[var(--color-surface-card)]" : ""}
        ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-center gap-3 flex-1">
          <Paperclip className="h-4 w-4 shrink-0" />
          <span>{fileName || "Click to upload or drag & drop"}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      {fileError && (
        <p className="text-[var(--color-danger)] text-sm">{fileError}</p>
      )}
    </div>
  );
}