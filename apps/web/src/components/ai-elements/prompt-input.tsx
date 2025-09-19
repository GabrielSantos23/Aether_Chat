"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";
import type { UploadedFile } from "@/lib/types";
import {
  Loader2Icon,
  SendIcon,
  SquareIcon,
  XIcon,
  ImageIcon,
  TrashIcon,
  FileIcon,
  Paperclip,
} from "lucide-react";
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from "react";
import React, {
  Children,
  createContext,
  useContext,
  useState,
  useRef,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "../ui/tooltip";
import { FileUploadButton } from "@/lib/uploadthing-components";

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      "w-full divide-y overflow-hidden rounded-xl border bg-transparent shadow-sm",
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const PromptInputTextarea = React.memo(
  ({
    onChange,
    className,
    placeholder = "What would you like to know?",
    minHeight = 48,
    maxHeight = 164,
    ...props
  }: PromptInputTextareaProps) => {
    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (e.key === "Enter") {
        if (e.nativeEvent.isComposing) {
          return;
        }

        if (e.shiftKey) {
          return;
        }

        e.preventDefault();
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <Textarea
        className={cn(
          "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
          "field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent",
          "focus-visible:ring-0",
          className
        )}
        name="message"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between p-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    size ?? Children.count(props.children) > 1 ? "default" : "icon";

  return (
    <Button
      className={cn(
        "shrink-0 gap-1.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground",
        newSize === "default" && "px-3",
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn("gap-1.5 rounded-lg", className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
  attachedFiles?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  setAttachedFiles?: (
    files: Array<{
      name: string;
      type: string;
      size: number;
      url: string;
    }>
  ) => void;
  onFileUpload?: (files: FileList | null) => void;
  onRemoveFile?: (index: number) => void;
  onUploadThingComplete?: (files: UploadedFile[]) => void;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
  attachedFiles: [],
  setAttachedFiles: () => {},
  onFileUpload: () => {},
  onRemoveFile: () => {},
  onUploadThingComplete: () => {},
});

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

type PromptInputActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

export function PromptInputAction({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger disabled={disabled} render={<div>{children}</div>} />
      <TooltipPositioner side={side}>
        <TooltipContent className={className}>{tooltip}</TooltipContent>
      </TooltipPositioner>
    </Tooltip>
  );
}

export type PromptInputImagePreviewProps = {
  file:
    | File
    | {
        name: string;
        type: string;
        size: number;
        url: string;
      };
  index: number;
  onRemove: (index: number) => void;
  className?: string;
  isUploading?: boolean;
  uploadProgress?: number;
};

export function PromptInputImagePreview({
  file,
  index,
  onRemove,
  className,
  isUploading = false,
  uploadProgress = 0,
}: PromptInputImagePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  React.useEffect(() => {
    if (isImage) {
      if ("url" in file) {
        setPreview(file.url);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [file, isImage]);

  if (!isImage || !preview) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm max-w-[200px]",
          className
        )}
      >
        <ImageIcon className="size-4" />
        <span className="truncate">{file.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => onRemove(index)}
        >
          <XIcon className="size-10" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="relative w-20 h-20 rounded-lg border overflow-hidden">
        {isUploading ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-muted-foreground text-xs font-medium">
              {Math.round(uploadProgress)}%
            </div>
          </div>
        ) : (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 size-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
        disabled={isUploading}
      >
        <XIcon className="size-10" />
      </Button>
    </div>
  );
}

export type PromptInputFileUploadProps = {
  accept?: string;
  multiple?: boolean;
  onFileSelect?: (files: FileList | null) => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
};

export function PromptInputFileUpload({
  accept = "image/*",
  multiple = true,
  onFileSelect,
  onUploadComplete,
  onUploadError,
  onUploadProgress,
  className,
}: PromptInputFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadBegin = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = (res: UploadedFile[]) => {
    setIsUploading(false);
    onUploadComplete?.(res);
  };

  const handleUploadError = (error: Error) => {
    console.error("PromptInputFileUpload: Upload error:", error);
    setIsUploading(false);
    onUploadError?.(error);
  };

  return (
    <FileUploadButton
      onUploadBegin={handleUploadBegin}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      className={cn("h-8 w-8 border hover:bg-accent rounded-full", className)}
      appearance={{
        button: cn(
          "h-8 w-8 rounded-full  bg-transparent  text-muted-foreground hover:text-foreground transition-colors p-0 flex items-center justify-center",
          className
        ),
        allowedContent: "hidden",
      }}
      content={{
        button: isUploading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <Paperclip className="size-4" />
        ),
        allowedContent: "",
      }}
    />
  );
}

export type PromptInputAttachmentsProps = {
  className?: string;
};

export function PromptInputAttachments({
  className,
}: PromptInputAttachmentsProps) {
  const { attachedFiles = [], onRemoveFile } = usePromptInput();

  if (attachedFiles.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 p-2", className)}>
      {attachedFiles.map((file, index) => (
        <PromptInputImagePreview
          key={`${file.name}-${index}`}
          file={file}
          index={index}
          onRemove={onRemoveFile || (() => {})}
        />
      ))}
    </div>
  );
}
