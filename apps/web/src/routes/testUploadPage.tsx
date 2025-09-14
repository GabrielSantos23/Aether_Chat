"use client";

import {
  FileUploadButton,
  FileUploadDropzone,
  FileUploader,
} from "@/lib/uploadthing-components";

export default function TestUploadPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">UploadThing Test Page</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload Button</h2>
        <FileUploadButton />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload Dropzone</h2>
        <FileUploadDropzone />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Uploader</h2>
        <FileUploader />
      </div>
    </div>
  );
}
