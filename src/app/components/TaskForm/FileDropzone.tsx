// "use client"; // Already present

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes } from "react-icons/fa";
import Image from "next/image"; // Import the Image component

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  acceptedFiles: File[];
  label: string;
}

export default function FileDropzone({
  onDrop,
  acceptedFiles,
  label,
}: FileDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  const handleDrop = useCallback(
    (accepted: File[]) => {
      onDrop(accepted);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
  });

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewType(file.type === "application/pdf" ? "pdf" : "image");
  };

  // ✅ Prevent background scroll and layout shift
  useEffect(() => {
    if (previewUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [previewUrl]);

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? "bg-purple-100 border-purple-500"
            : "bg-purple-50 border-purple-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-center text-gray-700 font-medium">{label}</p>

        {acceptedFiles?.length > 0 && (
          <ul className="mt-2 text-sm text-gray-600 space-y-2 max-h-32 overflow-auto">
            {acceptedFiles.map((file, i) => (
              <li key={i} className="flex justify-between items-center gap-2">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent file picker
                    handlePreview(file);
                  }}
                  className="text-blue-600 text-xs hover:underline"
                >
                  👁️ Preview
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full relative shadow-lg">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setPreviewType(null);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
              <FaTimes size={18} />
            </button>

            {previewType === "pdf" ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded border"
                title="PDF Preview"
              />
            ) : (
              // Replaced <img> with <Image />
              <Image
                src={previewUrl}
                alt="Preview"
                // The actual width and height should reflect the natural dimensions or desired display dimensions.
                // For a modal, often you want it to fill the container while maintaining aspect ratio.
                // A common practice for `object-contain` is to provide generous width/height.
                // You might need to adjust these values based on your UI needs or dynamically from the image itself.
                width={700} // Example width, adjust as needed
                height={500} // Example height, adjust as needed
                className="w-full max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}