import { PdfStandardFont } from './enums';
import { PdfGateDocument } from './interfaces';

export type ExtractPdfDataRequest =
  | { file: { name: string; data: Buffer } }
  | { documentId: string };

export type GeneratePdfResponse<P> = P extends { jsonResponse: true } ? PdfGateDocument : Buffer;

export type FlattenPdfRequest =
  | {
      file: { name: string; data: Buffer };
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    }
  | {
      documentId: string;
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    };

export type FlattenPdfResponse<P> = P extends { jsonResponse: true } ? PdfGateDocument : Buffer;

export type CompressPdfRequest =
  | {
      file: { name: string; data: Buffer };
      jsonResponse?: boolean;
      linearize?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    }
  | {
      documentId: string;
      jsonResponse?: boolean;
      linearize?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    };

export type CompressPdfResponse<P> = P extends { jsonResponse: true } ? PdfGateDocument : Buffer;

export type WatermarkPdfRequest =
  | {
      file: { name: string; data: Buffer };
      watermark?: { name: string; data: Buffer };
      fontFile?: { name: string; data: Buffer };
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
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    }
  | {
      documentId: string;
      watermark?: { name: string; data: Buffer };
      fontFile?: { name: string; data: Buffer };
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
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    };

export type WatermarkPdfResponse<P> = P extends { jsonResponse: true } ? PdfGateDocument : Buffer;

export type ProtectPdfRequest =
  | {
      file: { name: string; data: Buffer };
      algorithm?: 'AES256' | 'AES128';
      userPassword?: string;
      ownerPassword?: string;
      disablePrint?: boolean;
      disableCopy?: boolean;
      disableEditing?: boolean;
      encryptMetadata?: boolean;
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    }
  | {
      documentId: string;
      algorithm?: 'AES256' | 'AES128';
      userPassword?: string;
      ownerPassword?: string;
      disablePrint?: boolean;
      disableCopy?: boolean;
      disableEditing?: boolean;
      encryptMetadata?: boolean;
      jsonResponse?: boolean;
      preSignedUrlExpiresIn?: number;
      metadata?: object;
    };

export type ProtectPdfResponse<P> = P extends { jsonResponse: true } ? PdfGateDocument : Buffer;
