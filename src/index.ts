import { HttpClient } from './httpClient';
import { GeneratePdfRequest, GetDocumentRequest, GetFileRequest, PdfGateDocument } from './types';
import { PdfGateApiError } from './types/classes';
import {
  CompressPdfRequest,
  CompressPdfResponse,
  ExtractPdfDataRequest,
  FlattenPdfRequest,
  FlattenPdfResponse,
  GeneratePdfResponse,
  ProtectPdfRequest,
  ProtectPdfResponse,
  WatermarkPdfRequest,
  WatermarkPdfResponse,
} from './types/types.js';

export default class PdfGate {
  private api: HttpClient;

  /**
   * Create a new PDFGate client.
   *
   * PDFGate uses two environments:
   * - **Sandbox** for `test_...` keys → `https://api-sandbox.pdfgate.com`
   * - **Production** for `live_...` keys → `https://api.pdfgate.com`
   *
   * Authentication is performed via the `Authorization: Bearer <API_KEY>` header.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param apiKey - Your PDFGate API key (must start with `test_` or `live_`).
   * @throws {PdfGateApiError} If the API key format is invalid.
   */
  constructor(apiKey: string) {
    if (!apiKey.startsWith('test_') && !apiKey.startsWith('live_')) {
      throw new PdfGateApiError('Invalid PDFGate api key');
    }
    const apiUrl = apiKey.startsWith('test_')
      ? 'https://api-sandbox.pdfgate.com'
      : 'https://api.pdfgate.com';

    this.api = new HttpClient({
      apiKey,
      apiUrl,
    });
  }

  /**
   * Generate a PDF from a URL or raw HTML.
   *
   * **Endpoint:** `POST /v1/generate/pdf`
   *
   * You must provide **either**:
   * - `url` (render a public page), or
   * - `html` (render raw HTML).
   *
   * By default the API returns a **raw PDF stream** (handled here as a `Buffer`).
   * If `jsonResponse: true`, the API returns a **document JSON** object with metadata,
   * including a temporary `fileUrl` (pre-signed URL) when enabled.
   *
   * Notes from the API docs:
   * - `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   * - `timeout` is in **milliseconds**, default/max 900000 (15 minutes).
   * - Supports options like page size/orientation, margins, header/footer, JS/CSS injection,
   *   wait strategies, `pageRanges`, etc.
   * - `enableFormFields` enables interactive fields based on supported HTML tags
   *   (and supports `<pdfgate-signature-field />`).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam GeneratePdfRequest.
   * @param params - Generation options; must include `url` or `html`.
   * @returns A `Buffer` (PDF bytes) by default, or a `PdfGateDocument` when `jsonResponse: true`.
   * @throws {PdfGateApiError} If neither `url` nor `html` is provided.
   */
  async generatePdf<P extends GeneratePdfRequest>(params: P): Promise<GeneratePdfResponse<P>> {
    if (!params.url && !params.html) {
      throw new PdfGateApiError("You must provide either a 'url' or 'html' parameter.");
    }
    const timeout = 15 * 60 * 1000; // 15 minutes
    if (params.jsonResponse) {
      return this.api.post<PdfGateDocument>(
        '/v1/generate/pdf',
        params,
        undefined,
        timeout
      ) as unknown as GeneratePdfResponse<P>;
    }
    return this.api.post<Buffer>(
      '/v1/generate/pdf',
      params,
      undefined,
      timeout
    ) as unknown as GeneratePdfResponse<P>;
  }

  /**
   * Flatten an interactive PDF into a static, non-editable PDF.
   *
   * **Endpoint:** `POST /forms/flatten`
   *
   * Provide **either**:
   * - `file` (upload a PDF), or
   * - `documentId` (reference an existing stored document).
   *
   * If `documentId` is provided, PDFGate creates a **new** flattened document (does not overwrite).
   * When `jsonResponse: true`, the response may include `derivedFrom` to indicate the original document ID.
   *
   * By default returns a raw PDF stream (handled here as `Buffer`).
   * If `jsonResponse: true`, returns a JSON document object (`PdfGateDocument`) with metadata and `fileUrl`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam FlattenPdfRequest.
   * @param params - Flatten options; includes `file` or `documentId`, optional `jsonResponse`, metadata, etc.
   * @returns A `Buffer` (PDF bytes) by default, or a `PdfGateDocument` when `jsonResponse: true`.
   */
  async flattenPdf<P extends FlattenPdfRequest>(params: P): Promise<FlattenPdfResponse<P>> {
    const contentType = 'multipart/form-data';
    const timeout = 3 * 60 * 1000; // 3 minutes
    if (params.jsonResponse) {
      return this.api.post<PdfGateDocument>(
        '/forms/flatten',
        params,
        contentType,
        timeout
      ) as unknown as FlattenPdfResponse<P>;
    }
    return this.api.post<Buffer>(
      '/forms/flatten',
      params,
      contentType,
      timeout
    ) as unknown as FlattenPdfResponse<P>;
  }

  /**
   * Compress/optimize a PDF to reduce file size.
   *
   * **Endpoint:** `POST /compress/pdf`
   *
   * Provide **either**:
   * - `file` (upload a PDF), or
   * - `documentId` (reference an existing stored document).
   *
   * Compression optimizes internal structures and stream compression without changing visual content.
   * Optionally enable `linearize` to help the first page render sooner over the network.
   *
   * By default returns a raw PDF stream (handled here as `Buffer`).
   * If `jsonResponse: true`, returns a JSON document object (`PdfGateDocument`) with metadata and `fileUrl`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam CompressPdfRequest.
   * @param params - Compress options; includes `file` or `documentId`, optional `linearize`, `jsonResponse`, metadata, etc.
   * @returns A `Buffer` (PDF bytes) by default, or a `PdfGateDocument` when `jsonResponse: true`.
   */
  async compressPdf<P extends CompressPdfRequest>(params: P): Promise<CompressPdfResponse<P>> {
    const contentType = 'multipart/form-data';
    const timeout = 3 * 60 * 1000; // 3 minutes
    if (params.jsonResponse) {
      return this.api.post<PdfGateDocument>(
        '/compress/pdf',
        params,
        contentType,
        timeout
      ) as unknown as CompressPdfResponse<P>;
    }
    return this.api.post<Buffer>(
      '/compress/pdf',
      params,
      contentType,
      timeout
    ) as unknown as CompressPdfResponse<P>;
  }

  /**
   * Apply a text or image watermark to a PDF.
   *
   * **Endpoint:** `POST /watermark/pdf`
   *
   * Provide **either**:
   * - `file` (upload a PDF), or
   * - `documentId` (reference an existing stored document).
   *
   * Watermark configuration highlights:
   * - `type` is required: `"text"` or `"image"`.
   * - For text watermarks: `text` required when `type="text"`.
   * - For image watermarks: upload `watermark` image file (`.png`, `.jpg`, `.jpeg`).
   * - Optional: `font` (standard PDF fonts), `fontFile` (`.ttf`/`.otf` overrides `font`),
   *   `fontSize`, `fontColor`, `opacity` (0..1), `xPosition`, `yPosition`, `imageWidth`, `imageHeight`, `rotate` (0..360).
   *
   * By default returns a raw PDF stream (handled here as `Buffer`).
   * If `jsonResponse: true`, returns a JSON document object (`PdfGateDocument`) with metadata and `fileUrl`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam WatermarkPdfRequest.
   * @param params - Watermark options; includes `file` or `documentId` plus watermark settings.
   * @returns A `Buffer` (PDF bytes) by default, or a `PdfGateDocument` when `jsonResponse: true`.
   */
  async watermarkPdf<P extends WatermarkPdfRequest>(params: P): Promise<WatermarkPdfResponse<P>> {
    const contentType = 'multipart/form-data';
    const timeout = 3 * 60 * 1000; // 3 minutes
    if (params.jsonResponse) {
      return this.api.post<PdfGateDocument>(
        '/watermark/pdf',
        params,
        contentType,
        timeout
      ) as unknown as WatermarkPdfResponse<P>;
    }
    return this.api.post<Buffer>(
      '/watermark/pdf',
      params,
      contentType,
      timeout
    ) as unknown as WatermarkPdfResponse<P>;
  }

  /**
   * Protect a PDF using encryption + optional permission restrictions.
   *
   * **Endpoint:** `POST /protect/pdf`
   *
   * Provide **either**:
   * - `file` (upload a PDF), or
   * - `documentId` (reference an existing stored document).
   *
   * Security options highlights:
   * - `algorithm`: `"AES256"` (default) or `"AES128"`.
   * - `userPassword`: password required to open the PDF (optional).
   * - `ownerPassword`: full control password; required in some cases (e.g., AES256 with `userPassword`).
   * - Restrictions: `disablePrint`, `disableCopy`, `disableEditing`.
   * - `encryptMetadata`: whether PDF metadata is encrypted (default `false`).
   *
   * The operation produces a new protected file and does not alter the original.
   *
   * By default returns a raw PDF stream (handled here as `Buffer`).
   * If `jsonResponse: true`, returns a JSON document object (`PdfGateDocument`) with metadata and `fileUrl`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam ProtectPdfRequest.
   * @param params - Protect options; includes `file` or `documentId`, encryption/restriction settings, etc.
   * @returns A `Buffer` (PDF bytes) by default, or a `PdfGateDocument` when `jsonResponse: true`.
   */
  async protectPdf<P extends ProtectPdfRequest>(params: P): Promise<ProtectPdfResponse<P>> {
    const contentType = 'multipart/form-data';
    const timeout = 3 * 60 * 1000; // 3 minutes
    if (params.jsonResponse) {
      return this.api.post<PdfGateDocument>(
        '/protect/pdf',
        params,
        contentType,
        timeout
      ) as unknown as ProtectPdfResponse<P>;
    }
    return this.api.post<Buffer>(
      '/protect/pdf',
      params,
      contentType,
      timeout
    ) as unknown as ProtectPdfResponse<P>;
  }

  /**
   * Extract form field data from a fillable PDF and return it as JSON.
   *
   * **Endpoint:** `POST /forms/extract-data`
   *
   * Provide **either**:
   * - `file` (upload a PDF), or
   * - `documentId` (reference an existing stored document).
   *
   * The response is a JSON object mapping form field names to their values.
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam ExtractPdfDataRequest.
   * @param params - Extraction request; includes `file` or `documentId`.
   * @returns A plain JSON object containing extracted PDF form data.
   */
  extractPdfFormData(params: ExtractPdfDataRequest) {
    const contentType = 'multipart/form-data';
    return this.api.post<Record<string, any>>('/forms/extract-data', params, contentType);
  }

  /**
   * Retrieve a stored document’s metadata (and optionally a fresh pre-signed download URL).
   *
   * **Endpoint:** `GET /document/{documentId}`
   *
   * Use this to fetch the document record (id, status, size, createdAt, etc.).
   * If you need a *new* pre-signed URL for downloading an existing stored file,
   * set `preSignedUrlExpiresIn` (seconds, min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam GetDocumentRequest.
   * @param params.id - The document ID.
   * @param params.preSignedUrlExpiresIn - Optional; pre-signed URL expiry in seconds.
   * @returns The `PdfGateDocument` object.
   */
  getDocument(params: GetDocumentRequest) {
    return this.api.get<PdfGateDocument>(`/document/${params.id}`, {
      preSignedUrlExpiresIn: params.preSignedUrlExpiresIn,
    });
  }

  /**
   * Download a raw PDF file by document ID.
   *
   * **Endpoint:** `GET /file/{documentId}`
   *
   * Important: Accessing stored generated files requires enabling
   * “Save files” in the PDFGate Dashboard settings (disabled by default).
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam GetFileRequest.
   * @param params.documentId - The document ID to download.
   * @returns The PDF bytes as a `Buffer`.
   */
  getFile(params: GetFileRequest) {
    return this.api.get<Buffer>(`/file/${params.documentId}`);
  }
}
