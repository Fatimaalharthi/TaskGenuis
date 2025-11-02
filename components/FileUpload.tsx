import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, error }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (file) {
      onFileUpload(file);
      setFile(null); 
    }
  };
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        setFile(event.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-brand-text">Generate Tasks from Document</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <label
            htmlFor="file-upload"
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="flex-1 flex justify-center items-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary transition-colors"
        >
            <div className="text-center">
                <UploadIcon className="mx-auto h-10 w-10 text-gray-400"/>
                <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                {file ? (
                   <span className="text-xs text-brand-text mt-1 block">{file.name}</span>
                ) : (
                    <p className="text-xs text-gray-400">TXT, MD, or other text files</p>
                )}
            </div>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md,.text" />
        </label>
        
        <button
          type="submit"
          disabled={!file || isLoading}
          className="px-6 py-3 bg-primary text-white font-bold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 flex items-center justify-center min-w-[150px]"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Generate Tasks'
          )}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default FileUpload;