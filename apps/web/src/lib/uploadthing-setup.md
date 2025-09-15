# UploadThing Setup

This project uses UploadThing for file uploads, specifically for image analysis in the chat interface.

## Files Created

1. **`src/lib/uploadthing.ts`** - Core UploadThing configuration
2. **`src/app/api/uploadthing/core.ts`** - API route handler
3. **`src/lib/uploadthing-components.tsx`** - React components for file uploads
4. **`src/app/test-upload/page.tsx`** - Test page for upload functionality

## Environment Variables Required

Add these to your `.env.local` file:

```env
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## Features Implemented

- Image preview in prompt input
- File upload with drag & drop support
- Image analysis integration with chat
- File removal functionality
- Multiple file support

## Usage

The image upload functionality is integrated into the chat interface. Users can:

1. Click the attachment button to select images
2. See image previews before sending
3. Remove images before sending
4. Send images for AI analysis

## Testing

Visit `/test-upload` to test the UploadThing integration independently.




