import {
  PageSizeType,
  DocumentStatus,
  DocumentType,
  EmulateMediaType,
  FileOrientation,
} from './enums';

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
