import { PdfStandardFont } from './enums';
import { PdfGateDocument } from './interfaces';

/**
 * A file payload sent to multipart endpoints.
 */
export type FileParam = {
  name: string;
  data: Buffer;
};

export type ExtractPdfDataRequest = { documentId: string };

export type GeneratePdfResponse = PdfGateDocument;

export type FlattenPdfRequest = {
  documentId: string;
  preSignedUrlExpiresIn?: number;
  metadata?: object;
};

export type FlattenPdfResponse = PdfGateDocument;

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
