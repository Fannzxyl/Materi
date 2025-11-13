
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            Nihongo Sensei AI
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
            Ubah PDF "Minna no Nihongo" Anda menjadi pelajaran interaktif!
        </p>

        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
        >
            <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf"
                onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center space-y-4 text-slate-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-semibold">
                    <label htmlFor="file-upload" className="text-rose-500 hover:text-rose-600 cursor-pointer font-semibold">Pilih file</label> atau jatuhkan di sini
                </p>
                <p className="text-sm">Hanya file PDF yang didukung</p>
            </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Aplikasi ini ditenagai oleh AI. Harap verifikasi informasi penting.
        </p>
    </div>
  );
};

export default FileUpload;
