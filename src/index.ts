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
import { PdfGateSignatureVerificationError } from './types/classes.js';
import { verifySignature } from './webhooks/verifySignature.js';
import {
  AddFormFieldsRequest,
  AddFormFieldsResponse,
  CompressPdfRequest,
  CompressPdfResponse,
  CreateEmbedLinkParams,
  CreateEmbedLinkResponse,
  CreateRecipientParams,
  CreateRecipientResponse,
  CreateWebhookRequest,
  CreateWebhookResponse,
  DeleteDocumentRequest,
  DeleteDocumentResponse,
  DeleteWebhookParams,
  DeleteWebhookResponse,
  ExtractPdfDataRequest,
  FlattenPdfRequest,
  FlattenPdfResponse,
  GeneratePdfResponse,
  GetEnvelopeParams,
  GetEnvelopeResponse,
  VoidEnvelopeParams,
  VoidEnvelopeResponse,
  DeleteEnvelopeParams,
  DeleteEnvelopeResponse,
  GetRecipientParams,
  GetRecipientResponse,
  GetWebhookParams,
  GetWebhookResponse,
  ListRecipientsParams,
  ListRecipientsResponse,
  ProtectPdfRequest,
  ProtectPdfResponse,
  SendEnvelopeParams,
  SendEnvelopeResponse,
  UpdateRecipientParams,
  UpdateRecipientResponse,
  UploadFileRequest,
  UploadFileResponse,
  WatermarkPdfRequest,
  WatermarkPdfResponse,
} from './types/types.js';
import { EmbedLinkResponse, PdfGateRecipient, WebhookResponse } from './types/interfaces.js';

export type {
  AddFormFieldsRequest,
  AddFormFieldsResponse,
  CreateEmbedLinkParams,
  CreateEmbedLinkResponse,
  CreateEnvelopeParams,
  CreateEnvelopeResponse,
  CreateRecipientParams,
  CreateRecipientResponse,
  CreateWebhookRequest,
  CreateWebhookResponse,
  DeleteDocumentRequest,
  DeleteDocumentResponse,
  DeleteWebhookParams,
  DeleteWebhookResponse,
  EnvelopeDocument,
  EnvelopeRecipient,
  FieldOverride,
  FlattenPdfRequest,
  FlattenPdfResponse,
  GetEnvelopeParams,
  GetEnvelopeResponse,
  GetRecipientParams,
  GetRecipientResponse,
  VoidEnvelopeParams,
  VoidEnvelopeResponse,
  DeleteEnvelopeParams,
  DeleteEnvelopeResponse,
  GetWebhookParams,
  GetWebhookResponse,
  ListRecipientsParams,
  ListRecipientsResponse,
  ManualField,
  SendEnvelopeParams,
  SendEnvelopeResponse,
  UpdateRecipientParams,
  UpdateRecipientResponse,
} from './types/types.js';

export type {
  PdfGateEnvelope,
  PdfGateRecipient,
  EmbedLinkResponse,
  EnvelopeDocumentResponse,
  EnvelopeRecipientResponse,
  EnvelopeFieldResponse,
  WebhookResponse,
  WebhookEvent,
} from './types/interfaces.js';

export { PdfGateSignatureVerificationError };

export {
  DocumentStatus,
  DocumentType,
  EnvelopeStatus,
  EnvelopeDocumentStatus,
  DocumentRecipientStatus,
  DocumentFieldType,
  PageSizeType,
  FileOrientation,
  EmulateMediaType,
  PdfStandardFont,
  WebhookStatus,
  WebhookEventType,
} from './types/enums.js';

/**
 * Verify a PDFGate webhook signature against the raw request body.
 *
 * @param secret - Your PDFGate webhook signing secret.
 * @param signatureHeader - The `x-pdfgate-signature` header value.
 * @param payload - The raw request body exactly as received.
 * @throws {PdfGateSignatureVerificationError} If the signature is missing, expired, or invalid.
 */
export { verifySignature };

export default class PdfGate {
  private api: HttpClient;

  static verifySignature = verifySignature;

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
   * Provide `fieldNames` to flatten only those specific form fields; the rest of
   * the form stays interactive. Omit it to flatten the whole document.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Flatten options; includes `documentId`, optional `fieldNames`, metadata, etc.
   * @returns A `PdfGateDocument`.
   */
  async flattenPdf(params: FlattenPdfRequest): Promise<FlattenPdfResponse> {
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/forms/flatten', payload, undefined, timeout);
  }

  /**
   * Add interactive form fields to a PDF.
   *
   * **Endpoint:** `POST /forms/fields`
   *
   * Provide:
   * - `documentId` (reference an existing stored document).
   *
   * Two complementary ways to add fields:
   * - `fieldOverrides`: customize placeholder fields detected in the PDF, keyed by field name.
   * - `fields`: place fields at explicit `x`/`y` positions on a given `page`.
   *
   * PDFGate creates a **new** document with the added fields (does not overwrite the original).
   * This SDK always requests JSON and returns a `PdfGateDocument`.
   *
   * `preSignedUrlExpiresIn` is in **seconds** (min 60, max 86400).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Options; includes `documentId`, optional `fieldOverrides`, `fields`, metadata, etc.
   * @returns A `PdfGateDocument`.
   */
  async addFormFields(params: AddFormFieldsRequest): Promise<AddFormFieldsResponse> {
    const payload = { ...params, jsonResponse: true };
    const timeout = 3 * 60 * 1000; // 3 minutes
    return this.api.post<PdfGateDocument>('/forms/fields', payload, undefined, timeout);
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
   * This endpoint returns a JSON document response and the SDK returns a `PdfGateDocument`.
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
      const payload: UploadFileRequest = { ...params };
      delete payload.url;
      return this.api.post<PdfGateDocument>('/upload', payload, 'multipart/form-data', timeout);
    }

    return this.api.post<PdfGateDocument>('/upload', params, undefined, timeout);
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
   * Each recipient is given either as `email` and `name` or as the
   * `recipientId` of a stored recipient. Recipients marked `embedded` sign
   * inside your application via {@link createEmbedLink} and receive no emails.
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
   * Send an envelope to its recipients so they can access the signing flow.
   *
   * **Endpoint:** `POST /envelope/{id}/send`
   *
   * This triggers PDFGate's recipient emails, secure signing links, and OTP verification flow.
   * Embedded recipients receive no email; create their signing links with
   * {@link createEmbedLink} after sending.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The envelope ID to send.
   * @returns The updated `PdfGateEnvelope`.
   */
  async sendEnvelope(params: SendEnvelopeParams): Promise<SendEnvelopeResponse> {
    return this.api.post<PdfGateEnvelope>(`/envelope/${params.id}/send`);
  }

  /**
   * Retrieve the current state of an envelope.
   *
   * **Endpoint:** `GET /envelope/{id}`
   *
   * Use this to inspect the envelope status, document progress, and recipient statuses.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The envelope ID to retrieve.
   * @returns The current `PdfGateEnvelope`.
   */
  getEnvelope(params: GetEnvelopeParams): Promise<GetEnvelopeResponse> {
    return this.api.get<PdfGateEnvelope>(`/envelope/${params.id}`);
  }

  /**
   * Void (cancel) an envelope in `created` or `in_progress` status.
   *
   * **Endpoint:** `POST /envelope/{id}/void`
   *
   * Recipients who have not signed yet are notified by email and their signing
   * links stop working. Documents already signed by all recipients are not
   * affected. The optional `reason` is visible to recipients. This action
   * cannot be undone.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The envelope ID to void.
   * @param params.reason - Optional reason, included in the cancellation email.
   * @returns The updated `PdfGateEnvelope` with `voided` status.
   */
  async voidEnvelope(params: VoidEnvelopeParams): Promise<VoidEnvelopeResponse> {
    return this.api.post<PdfGateEnvelope>(
      `/envelope/${params.id}/void`,
      params.reason ? { reason: params.reason } : {},
    );
  }

  /**
   * Permanently delete an envelope and the files it produced.
   *
   * **Endpoint:** `DELETE /envelope/{id}`
   *
   * The signed documents and audit logs are removed from storage, recipient
   * data is anonymized, and recipients lose access. Source documents are not
   * deleted. Only envelopes in `draft`, `completed`, `expired`, or `voided`
   * status can be deleted — void an active envelope first. This action cannot
   * be undone.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The envelope ID to delete.
   */
  async deleteEnvelope(params: DeleteEnvelopeParams): Promise<DeleteEnvelopeResponse> {
    await this.api.delete<void>(`/envelope/${params.id}`);
  }

  /**
   * Create a short-lived signing link for an embedded recipient.
   *
   * **Endpoint:** `POST /envelope/{id}/embed-link`
   *
   * Render the returned URL in an iframe inside your application. The envelope
   * must be in `in_progress` status and the link expires after 10 minutes, so
   * create it when the signer is ready (one link per signing session). When the
   * session ends the iframe redirects to `returnUrl` with `event`
   * (`signing_complete`, `voided`, `expired` or `not_found`), `envelopeId`,
   * `documentId` and `recipientId` appended as query parameters; existing
   * `returnUrl` query parameters are preserved.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The envelope ID.
   * @param params.documentId - The envelope document ID (`sourceDocumentId`).
   * @param params.recipientId - The recipient ID of the embedded recipient.
   * @param params.returnUrl - URL the signing session redirects to when it ends.
   * @returns An `EmbedLinkResponse` with the signing `url` and its `expiresAt`.
   */
  async createEmbedLink(params: CreateEmbedLinkParams): Promise<CreateEmbedLinkResponse> {
    const { id, ...body } = params;
    return this.api.post<EmbedLinkResponse>(`/envelope/${id}/embed-link`, body);
  }

  /**
   * Store a recipient in your account so envelopes can reference them by
   * `recipientId`.
   *
   * **Endpoint:** `POST /recipient`
   *
   * Emails are not unique; every call creates a new recipient. List existing
   * recipients first when reuse is intended.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.email - Recipient email. Stored lowercased and cannot be changed later.
   * @param params.name - Optional recipient name.
   * @param params.metadata - Optional custom key/value metadata.
   * @returns The created `PdfGateRecipient`.
   */
  async createRecipient(params: CreateRecipientParams): Promise<CreateRecipientResponse> {
    return this.api.post<PdfGateRecipient>('/recipient', params);
  }

  /**
   * List stored recipients with the given email.
   *
   * **Endpoint:** `GET /recipients`
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.email - Email to look up (case-insensitive).
   * @returns An object with the matching `recipients`.
   */
  listRecipients(params: ListRecipientsParams): Promise<ListRecipientsResponse> {
    return this.api.get<ListRecipientsResponse>(
      `/recipients?email=${encodeURIComponent(params.email)}`,
    );
  }

  /**
   * Retrieve a stored recipient by ID.
   *
   * **Endpoint:** `GET /recipient/{id}`
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The recipient ID.
   * @returns The `PdfGateRecipient`.
   */
  getRecipient(params: GetRecipientParams): Promise<GetRecipientResponse> {
    return this.api.get<PdfGateRecipient>(`/recipient/${params.id}`);
  }

  /**
   * Update a stored recipient's name or metadata.
   *
   * **Endpoint:** `PATCH /recipient/{id}`
   *
   * The email cannot be changed. Existing envelopes are not affected; they
   * keep the recipient name they were created with.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The recipient ID.
   * @param params.name - New recipient name.
   * @param params.metadata - Replacement custom key/value metadata.
   * @returns The updated `PdfGateRecipient`.
   */
  async updateRecipient(params: UpdateRecipientParams): Promise<UpdateRecipientResponse> {
    const { id, ...body } = params;
    return this.api.patch<PdfGateRecipient>(`/recipient/${id}`, body);
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

  /**
   * Permanently delete a stored document.
   *
   * **Endpoint:** `DELETE /document/{documentId}`
   *
   * The document and its underlying stored file are removed. A document that is
   * referenced by a draft or in-progress envelope cannot be deleted until those
   * envelopes are completed or expired.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.documentId - The document ID to delete.
   */
  async deleteDocument(params: DeleteDocumentRequest): Promise<DeleteDocumentResponse> {
    await this.api.delete<void>(`/document/${params.documentId}`);
  }

  /**
   * Register a webhook endpoint to receive PDFGate event notifications.
   *
   * **Endpoint:** `POST /webhook`
   *
   * Provide:
   * - `url` (a publicly accessible HTTPS URL; localhost is not supported)
   * - `eventTypes` (the events to subscribe to)
   * - `description` (optional)
   *
   * The response includes a `secret` (returned **only once**, at creation time)
   * used to verify webhook payloads via {@link verifySignature}.
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params - Webhook creation options.
   * @returns The created `WebhookResponse`, including the signing `secret`.
   */
  async createWebhook(params: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    return this.api.post<WebhookResponse>('/webhook', params);
  }

  /**
   * Retrieve a registered webhook by ID.
   *
   * **Endpoint:** `GET /webhook/{id}`
   *
   * The `secret` is not returned by this endpoint (only at creation time).
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The webhook ID to retrieve.
   * @returns The `WebhookResponse`.
   */
  getWebhook(params: GetWebhookParams): Promise<GetWebhookResponse> {
    return this.api.get<WebhookResponse>(`/webhook/${params.id}`);
  }

  /**
   * Delete a registered webhook.
   *
   * **Endpoint:** `DELETE /webhook/{id}`
   *
   * @see https://pdfgate.com/documentation
   *
   * @param params.id - The webhook ID to delete.
   */
  async deleteWebhook(params: DeleteWebhookParams): Promise<DeleteWebhookResponse> {
    await this.api.delete<void>(`/webhook/${params.id}`);
  }
}
