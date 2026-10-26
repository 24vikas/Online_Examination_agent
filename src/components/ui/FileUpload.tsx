import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  onFileSelected: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  label?: string;
  helperText?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxSizeMb = 10,
  onFileSelected,
  selectedFile,
  onClear,
  label = 'Upload file',
  helperText = 'PDF, DOCX up to 10MB',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= maxSizeMb * 1024 * 1024) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= maxSizeMb * 1024 * 1024) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {selectedFile ? (
        <div className="flex items-center justify-between p-3 bg-[#F6F9F6] border border-[#E3EAE6] rounded-[10px]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText className="w-5 h-5 text-[#1F4D3F] shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-[#10251F] truncate">{selectedFile.name}</p>
              <p className="text-[11px] font-mono tabular-nums text-[#5B6B66]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-[#5B6B66] hover:text-[#B91C1C] rounded transition-colors"
              aria-label="Remove uploaded file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[12px] p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-[#1F4D3F] bg-[#D6EBDD]/20'
              : 'border-[#E3EAE6] bg-[#F6F9F6] hover:bg-white hover:border-[#1F4D3F]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-[#5B6B66] mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#10251F]">{label}</p>
          <p className="text-[11px] text-[#5B6B66] mt-0.5">{helperText}</p>
        </div>
      )}
    </div>
  );
};
