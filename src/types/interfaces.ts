import {
  DocumentFieldType,
  DocumentRecipientStatus,
  PageSizeType,
  DocumentStatus,
  DocumentType,
  EnvelopeDocumentStatus,
  EnvelopeStatus,
  EmulateMediaType,
  FileOrientation,
  WebhookEventType,
  WebhookStatus,
} from './enums.js';

export interface GetDocumentRequest {
  id: string;
  preSignedUrlExpiresIn?: number;
}

export interface GetFileRequest {
  documentId: string;
}

export interface PdfGateDocument {
  id: string;
  status: DocumentStatus;
  type?: DocumentType;
  fileUrl?: string;
  size?: number;
  metadata?: object;
  derivedFrom?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface WebhookEvent {
  eventId: string;
  event: string;
  timestamp: Date;
  resource: {
    kind: string;
    id: string;
  };
  data: Record<string, any>;
}

export interface WebhookResponse {
  id: string;
  url: string;
  eventTypes: WebhookEventType[];
  status: WebhookStatus;
  description?: string;
  /**
   * The signing secret used to verify webhook payloads. Only returned once,
   * when the webhook is created.
   */
  secret?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface EnvelopeFieldResponse {
  name: string;
  type: DocumentFieldType;
  value?: any;
  checked?: boolean;
  /**
   * IANA timezone identifier for the stored `value`. For `datetime` fields the
   * `value` is normalized to UTC, so this is `"UTC"` once a value is captured.
   */
  timezone?: string;
  /**
   * Where the value originated: `"server"` for auto-filled fields or `"user"`
   * for values submitted by the recipient.
   */
  source?: string;
  /**
   * The original value exactly as submitted by the recipient, before any
   * UTC normalization (populated for `datetime` fields).
   */
  userValue?: string;
  /**
   * The IANA timezone the recipient submitted `userValue` in (populated for
   * `datetime` fields).
   */
  userTimezone?: string;
}

export interface EnvelopeRecipientResponse {
  /** ID of the stored recipient linked to this envelope recipient. */
  recipientId?: string;
  email: string;
  status: DocumentRecipientStatus;
  signedAt?: Date;
  viewedAt?: Date;
  fields: EnvelopeFieldResponse[];
  signingLink?: string;
  previewLink?: string;
}

export interface EnvelopeDocumentResponse {
  sourceDocumentId: string;
  signedDocumentId?: string;
  auditLogDocumentId?: string;
  recipients: EnvelopeRecipientResponse[];
  status: EnvelopeDocumentStatus;
  completedAt?: Date;
}

export interface PdfGateEnvelope {
  id: string;
  status: EnvelopeStatus;
  documents: EnvelopeDocumentResponse[];
  createdAt: Date;
  /** When the envelope will expire if it is not completed. */
  expiresAt?: Date;
  completedAt?: Date;
  expiredAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  metadata?: object;
}

export interface PdfGateRecipient {
  id: string;
  email?: string;
  name?: string;
  metadata?: object;
  createdAt: Date;
  updatedAt?: Date;
  /** Last time the recipient was referenced by an envelope. */
  lastUsedAt?: Date;
}

export interface EmbedLinkResponse {
  /** Signing URL to render inside your application. */
  url: string;
  /** When the link expires. Links are valid for 10 minutes. */
  expiresAt: Date;
}

export interface GeneratePdfRequest {
  html?: string;
  url?: string;
  pageSizeType?: PageSizeType;
  width?: number;
  height?: number;
  orientation?: FileOrientation;
  header?: string;
  footer?: string;
  margin?: PdfPageMargin;
  timeout?: number;
  javascript?: string;
  css?: string;
  emulateMediaType?: EmulateMediaType;
  httpHeaders?: Record<string, string>;
  metadata?: object;
  waitForSelector?: string;
  clickSelector?: string;
  clickSelectorChainSetup?: ClickSelectorChainSetup;
  waitForNetworkIdle?: boolean;
  grayscale?: boolean;
  enableFormFields?: boolean;
  delay?: number;
  loadImages?: boolean;
  scale?: number;
  pageRanges?: string;
  printBackground?: boolean;
  preSignedUrlExpiresIn?: number;
  userAgent?: string;
  authentication?: PageAuthentication;
  viewport?: Viewport;
}

export interface PdfPageMargin {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface ClickSelectorChainSetup {
  ignoreFailingChains?: boolean;
  chains: ClickSelectorChain[];
}

export interface ClickSelectorChain {
  selectors: string[];
}

export interface PageAuthentication {
  username: string;
  password: string;
}

export interface Viewport {
  width: number;
  height: number;
}
