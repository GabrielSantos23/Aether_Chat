"use client";
import { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

export function FileUploadButton({
  onUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
  className,
  appearance,
  content,
}: {
  onUploadComplete?: (res: any[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
  appearance?: {
    button?: string;
    allowedContent?: string;
  };
  content?: {
    button?: React.ReactNode;
    allowedContent?: string;
  };
}) {
  return (
    <UploadButton<OurFileRouter, "fileUploader">
      endpoint="fileUploader"
      className={className}
      appearance={appearance}
      content={content}
      onBeforeUploadBegin={(files) => {
        console.log("FileUploadButton: Before upload begin with files:", files);
        onUploadBegin?.(files);
        return files;
      }}
      onUploadProgress={(progress) => {
        console.log("FileUploadButton: Upload progress:", progress);
        onUploadProgress?.(progress);
      }}
      onClientUploadComplete={(res: any[]) => {
        console.log("FileUploadButton: Files uploaded:", res);
        onUploadComplete?.(res);
      }}
      onUploadError={(error: Error) => {
        console.error("FileUploadButton: Upload error:", error);
        onUploadError?.(error);
      }}
    />
  );
}

export function FileUploadDropzone({
  onUploadComplete,
  onUploadError,
}: {
  onUploadComplete?: (res: any[]) => void;
  onUploadError?: (error: Error) => void;
}) {
  return (
    <UploadDropzone<OurFileRouter, "fileUploader">
      endpoint="fileUploader"
      onClientUploadComplete={(res: any[]) => {
        console.log("Files: ", res);
        onUploadComplete?.(res);
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
        onUploadError?.(error);
      }}
    />
  );
}

export function FileUploader({
  onUploadComplete,
  onUploadError,
}: {
  onUploadComplete?: (res: any[]) => void;
  onUploadError?: (error: Error) => void;
}) {
  return (
    <Uploader<OurFileRouter, "fileUploader">
      endpoint="fileUploader"
      onClientUploadComplete={(res: any[]) => {
        console.log("Files: ", res);
        onUploadComplete?.(res);
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
        onUploadError?.(error);
      }}
    />
  );
}
