import PdfGate from '../../src/index.js';
import { PdfGateDocument } from '../../src/types/index.js';

const client = new PdfGate('test_api_key');

const generatePromise: Promise<PdfGateDocument> = client.generatePdf({
  url: 'https://example.com',
});
const flattenPromise: Promise<PdfGateDocument> = client.flattenPdf({
  documentId: 'doc_1',
});
const compressPromise: Promise<PdfGateDocument> = client.compressPdf({
  documentId: 'doc_1',
});
const watermarkPromise: Promise<PdfGateDocument> = client.watermarkPdf({
  documentId: 'doc_1',
  type: 'text',
  text: 'watermark',
});
const protectPromise: Promise<PdfGateDocument> = client.protectPdf({
  documentId: 'doc_1',
});

void generatePromise;
void flattenPromise;
void compressPromise;
void watermarkPromise;
void protectPromise;

// @ts-expect-error jsonResponse must not be part of public API.
client.generatePdf({ url: 'https://example.com', jsonResponse: true });
// @ts-expect-error jsonResponse must not be part of public API.
client.flattenPdf({ documentId: 'doc_1', jsonResponse: true });
// @ts-expect-error jsonResponse must not be part of public API.
client.compressPdf({ documentId: 'doc_1', jsonResponse: true });
// @ts-expect-error jsonResponse must not be part of public API.
client.watermarkPdf({ documentId: 'doc_1', type: 'text', text: 'wm', jsonResponse: true });
// @ts-expect-error jsonResponse must not be part of public API.
client.protectPdf({ documentId: 'doc_1', jsonResponse: true });
