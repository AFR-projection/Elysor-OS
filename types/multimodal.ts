export type AttachmentKind = "image" | "video" | "pdf" | "text" | "audio" | "other";

export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  /** Base64 data URL — client only / transit, not persisted in DB */
  dataUrl?: string;
  /** Text extracted client-side for preview */
  textPreview?: string;
}

export interface MessageAttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
}

export type OpenRouterTextPart = {
  type: "text";
  text: string;
};

export type OpenRouterImagePart = {
  type: "image_url";
  image_url: { url: string };
};

export type OpenRouterVideoPart = {
  type: "video_url";
  video_url: { url: string };
};

export type OpenRouterFilePart = {
  type: "file";
  file: {
    filename: string;
    file_data: string;
  };
};

export type OpenRouterContentPart =
  | OpenRouterTextPart
  | OpenRouterImagePart
  | OpenRouterVideoPart
  | OpenRouterFilePart;

export const ATTACHMENT_LIMITS = {
  maxCount: 8,
  maxImageBytes: 12 * 1024 * 1024,
  maxVideoBytes: 40 * 1024 * 1024,
  maxPdfBytes: 20 * 1024 * 1024,
  maxTextBytes: 512 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
} as const;
