import { HttpClient } from './httpClient/index.js';
import {
  CreateEnvelopeParams,
  CreateEnvelopeResponse,
  GeneratePdfRequest,
  GetDocumentRequest,
  GetFileRequest,
  PdfGateEnvelope,
  PdfGateDocument,
} from './types/index.js';
import { PdfGateApiError } from './types/classes.js';
import {
  CompressPdfRequest,
  CompressPdfResponse,
  ExtractPdfDataRequest,
  FlattenPdfRequest,
  FlattenPdfResponse,
  GeneratePdfResponse,
  ProtectPdfRequest,
  ProtectPdfResponse,
  UploadFileRequest,
  UploadFileResponse,
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
   * This SDK always requests a JSON response from this endpoint and returns a
   * **document JSON** object with metadata, including a temporary `fileUrl`
   * (pre-signed URL) when enabled.
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
   * @param params - Generation options; must include `url` or `html`.
   * @returns A `PdfGateDocument`.
   * @throws {PdfGateApiError} If neither `url` nor `html` is provided.
   */
  async generatePdf(params: GeneratePdfRequest): Promise<GeneratePdfResponse> {
    if (!params.url && !params.html) {
      throw new PdfGateApiError("You must provide either a 'url' or 'html' parameter.");
    }
    const payload = { ...params, jsonResponse: true };
    const timeout = 15 * 60 * 1000; // 15 minutes
    return this.api.post<PdfGateDocument>('/v1/generate/pdf', payload, undefined, timeout);
  }

  /**
   * Flatten an interactive PDF into a static, non-editable PDF.
   *
   * **Endpoint:** `POST /forms/flatten`
   *
   * Provide:
   * - `documentId` (reference an existing stored document).
   *
   * If `documentId` is provided, PDFGate creates a **new** flattened document (does not overwrite).
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Flatten options; includes `documentId`, optional metadata, etc.
   * @returns A `PdfGateDocument`.
   */
  async flattenPdf(params: FlattenPdfRequest): Promise<FlattenPdfResponse> {
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/forms/flatten', payload, undefined, timeout);
  }

  /**
   * Compress/optimize a PDF to reduce file size.
   *
   * **Endpoint:** `POST /compress/pdf`
   *
   * Provide:
   * - `documentId` (reference an existing stored document).
   *
   * Compression optimizes internal structures and stream compression without changing visual content.
   * Optionally enable `linearize` to help the first page render sooner over the network.
   *
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Compress options; includes `documentId`, optional `linearize`, metadata, etc.
   * @returns A `PdfGateDocument`.
   */
  async compressPdf(params: CompressPdfRequest): Promise<CompressPdfResponse> {
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/compress/pdf', payload, undefined, timeout);
  }

  /**
   * Upload a raw PDF file so it can be referenced by other PDF operations.
   *
   * **Endpoint:** `POST /upload`
   *
   * Provide:
   * - `file` (multipart upload), or
   * - `url` (JSON body with a source URL).
   *
   * When both `file` and `url` are provided, `file` is prioritized and
   * the request is sent as multipart/form-data.
   *
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * Important: Accessing stored generated files requires enabling
   * “Save files” in the PDFGate Dashboard settings (disabled by default).
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Upload options; includes `file` and/or `url`, optional metadata, etc.
   * @returns A `PdfGateDocument`.
   */
  async uploadFile(params: UploadFileRequest): Promise<UploadFileResponse> {
    const timeout = 3 * 60 * 1000; // 3 minutes
    if (params.file) {
      const payload: UploadFileRequest & { jsonResponse: true } = {
        ...params,
        jsonResponse: true,
      };
      delete payload.url;
      return this.api.post<PdfGateDocument>('/upload', payload, 'multipart/form-data', timeout);
    }

    const payload = { ...params, jsonResponse: true };
    return this.api.post<PdfGateDocument>('/upload', payload, undefined, timeout);
  }

  /**
   * Apply a text or image watermark to a PDF.
   *
   * **Endpoint:** `POST /watermark/pdf`
   *
   * Provide:
   * - `documentId` (reference an existing stored document).
   *
   * Watermark configuration highlights:
   * - `type` is required: `"text"` or `"image"`.
   * - For text watermarks: `text` required when `type="text"`.
   * - For image watermarks: upload `watermark` image file (`.png`, `.jpg`, `.jpeg`).
   * - This endpoint remains multipart because it can include image/font file uploads.
   * - Optional: `font` (standard PDF fonts), `fontFile` (`.ttf`/`.otf` overrides `font`),
   *   `fontSize`, `fontColor`, `opacity` (0..1), `xPosition`, `yPosition`, `imageWidth`, `imageHeight`, `rotate` (0..360).
   *
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Watermark options; includes `documentId` plus watermark settings.
   * @returns A `PdfGateDocument`.
   */
  async watermarkPdf(params: WatermarkPdfRequest): Promise<WatermarkPdfResponse> {
    const contentType = 'multipart/form-data';
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/watermark/pdf', payload, contentType, timeout);
  }

  /**
   * Protect a PDF using encryption + optional permission restrictions.
   *
   * **Endpoint:** `POST /protect/pdf`
   *
   * Provide:
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
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Protect options; includes `documentId`, encryption/restriction settings, etc.
   * @returns A `PdfGateDocument`.
   */
  async protectPdf(params: ProtectPdfRequest): Promise<ProtectPdfResponse> {
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/protect/pdf', payload, undefined, timeout);
  }

  /**
   * Create an envelope from existing source documents for signing workflows.
   *
   * **Endpoint:** `POST /envelope`
   *
   * Provide:
   * - `requesterName` (who or what system created the envelope)
   * - `documents` (source documents + recipients for each document)
   *
   * The SDK forwards the payload as-is, preserving the API's camelCase wire format,
   * and returns the envelope JSON response.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Envelope creation options.
   * @returns A `PdfGateEnvelope`.
   */
  async createEnvelope(params: CreateEnvelopeParams): Promise<CreateEnvelopeResponse> {
    return this.api.post<PdfGateEnvelope>('/envelope', params);
  }

  /**
   * Extract form field data from a fillable PDF and return it as JSON.
   *
   * **Endpoint:** `POST /forms/extract-data`
   *
   * Provide:
   * - `documentId` (reference an existing stored document).
   *
   * The response is a JSON object mapping form field names to their values.
   *
   * @see https://pdfgate.com/documentation
   *
   * @typeParam ExtractPdfDataRequest.
   * @param params - Extraction request; includes `documentId`.
   * @returns A plain JSON object containing extracted PDF form data.
   */
  extractPdfFormData(params: ExtractPdfDataRequest) {
    return this.api.post<Record<string, any>>('/forms/extract-data', params);
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
