import { DocumentFieldType, PdfStandardFont, WebhookEventType } from './enums.js';
import {
  EmbedLinkResponse,
  PdfGateDocument,
  PdfGateEnvelope,
  PdfGateRecipient,
  WebhookResponse,
} from './interfaces.js';

/**
 * A file payload sent to multipart endpoints.
 */
export type FileParam = {
  name: string;
  data: Buffer;
};

export type ExtractPdfDataRequest = { documentId: string };

export type GeneratePdfResponse = PdfGateDocument;

/**
 * Parameters for uploading a raw PDF file to PDFGate.
 *
 * When both `file` and `url` are provided, the SDK prioritizes `file`
 * and sends the request as multipart/form-data.
 */
export type UploadFileRequest = {
  file?: FileParam;
  url?: string;
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type UploadFileResponse = PdfGateDocument;

export type FlattenPdfRequest = {
  documentId: string;
  /**
   * Names of the form fields to flatten. When provided, only these fields are
   * flattened and the rest of the form stays interactive. When omitted, the
   * whole document is flattened.
   */
  fieldNames?: string[];
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type FlattenPdfResponse = PdfGateDocument;

export type DeleteDocumentRequest = {
  documentId: string;
};

export type DeleteDocumentResponse = void;

/**
 * Overrides applied to placeholder fields detected in the PDF, keyed by field name.
 */
export type FieldOverride = {
  options?: string[];
  height?: number;
  width?: number;
  role?: string;
  fontSize?: number;
  autoFill?: boolean;
  optional?: boolean;
  description?: string;
};

/**
 * A form field placed at an explicit position on a given page.
 */
export type ManualField = {
  name: string;
  type: DocumentFieldType;
  page: number;
  height: number;
  width: number;
  x: number;
  y: number;
  value?: string;
  options?: string[];
  role?: string;
  fontSize?: number;
  autoFill?: boolean;
  optional?: boolean;
  description?: string;
};

export type AddFormFieldsRequest = {
  documentId: string;
  /**
   * Overrides for placeholder fields detected in the PDF, keyed by field name.
   */
  fieldOverrides?: Record<string, FieldOverride>;
  /**
   * Fields to add at explicit positions on the document.
   */
  fields?: ManualField[];
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type AddFormFieldsResponse = PdfGateDocument;

export type CreateWebhookRequest = {
  url: string;
  eventTypes: WebhookEventType[];
  description?: string;
};

export type CreateWebhookResponse = WebhookResponse;

export type GetWebhookParams = {
  id: string;
};

export type GetWebhookResponse = WebhookResponse;

export type DeleteWebhookParams = {
  id: string;
};

export type DeleteWebhookResponse = void;

export type CompressPdfRequest = {
  documentId: string;
  linearize?: boolean;
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type CompressPdfResponse = PdfGateDocument;

export type WatermarkPdfRequest = {
  documentId: string;
  watermark?: FileParam;
  fontFile?: FileParam;
  type?: 'text' | 'image';
  text?: string;
  font?: PdfStandardFont;
  fontSize?: number;
  fontColor?: string;
  opacity?: number;
  xPosition?: number;
  yPosition?: number;
  imageWidth?: number;
  imageHeight?: number;
  rotate?: number;
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type WatermarkPdfResponse = PdfGateDocument;

export type ProtectPdfRequest = {
  documentId: string;
  algorithm?: 'AES256' | 'AES128';
  userPassword?: string;
  ownerPassword?: string;
  disablePrint?: boolean;
  disableCopy?: boolean;
  disableEditing?: boolean;
  encryptMetadata?: boolean;
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type ProtectPdfResponse = PdfGateDocument;

export type EnvelopeRecipient = {
  /**
   * ID of a stored recipient to reuse. Provide either `recipientId` or
   * `email` and `name`, never both.
   */
  recipientId?: string;
  /** Required when `recipientId` is not provided. */
  email?: string;
  /** Required when `recipientId` is not provided. */
  name?: string;
  role?: string;
  reminderIntervalDays?: number;
  reminderAttempts?: number;
  /**
   * Embedded recipients sign inside your own application through an embed
   * link and receive no emails from PDFGate.
   */
  embedded?: boolean;
};

export type EnvelopeDocument = {
  sourceDocumentId: string;
  name: string;
  recipients: EnvelopeRecipient[];
};

export type CreateEnvelopeParams = {
  documents: EnvelopeDocument[];
  requesterName: string;
  metadata?: object;
  /**
   * Days until the envelope and its signing links expire, counted from creation
   * (min 1, max 90). Defaults to the account's envelope expiration setting.
   */
  expiresInDays?: number;
};

export type CreateEnvelopeResponse = PdfGateEnvelope;

export type SendEnvelopeParams = {
  id: string;
};

export type SendEnvelopeResponse = PdfGateEnvelope;

export type GetEnvelopeParams = {
  id: string;
};

export type GetEnvelopeResponse = PdfGateEnvelope;

export type VoidEnvelopeParams = {
  id: string;
  /**
   * Reason for voiding (max 500 characters). Visible to recipients: included in
   * the cancellation email sent to recipients who had not signed yet.
   */
  reason?: string;
};

export type VoidEnvelopeResponse = PdfGateEnvelope;

export type DeleteEnvelopeParams = {
  id: string;
};

export type DeleteEnvelopeResponse = void;

export type CreateEmbedLinkParams = {
  /** The envelope ID. The envelope must be in `in_progress` status. */
  id: string;
  /** The envelope document ID (`sourceDocumentId`). */
  documentId: string;
  /** The recipient ID of the embedded recipient. */
  recipientId: string;
  /** URL the signing session redirects to when it ends. */
  returnUrl: string;
};

export type CreateEmbedLinkResponse = EmbedLinkResponse;

export type CreateRecipientParams = {
  /** Recipient email. Stored lowercased and cannot be changed later. */
  email: string;
  name?: string;
  metadata?: object;
};

export type CreateRecipientResponse = PdfGateRecipient;

export type ListRecipientsParams = {
  /** Email to look up (case-insensitive). */
  email: string;
};

export type ListRecipientsResponse = {
  recipients: PdfGateRecipient[];
};

export type GetRecipientParams = {
  id: string;
};

export type GetRecipientResponse = PdfGateRecipient;

export type UpdateRecipientParams = {
  id: string;
  name?: string;
  metadata?: object;
};

export type UpdateRecipientResponse = PdfGateRecipient;
