import PdfGate, { DocumentFieldType, verifySignature, WebhookEventType } from '../../src/index.js';
import {
  EmbedLinkResponse,
  ListRecipientsResponse,
  PdfGateDocument,
  PdfGateEnvelope,
  PdfGateRecipient,
  WebhookEvent,
  WebhookResponse,
} from '../../src/types/index.js';

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
const createEnvelopePromise: Promise<PdfGateEnvelope> = client.createEnvelope({
  requesterName: 'John Doe',
  documents: [
    {
      sourceDocumentId: 'doc_1',
      name: 'Agreement',
      recipients: [
        {
          email: 'anna@example.com',
          name: 'Anna Smith',
        },
      ],
    },
  ],
});
const sendEnvelopePromise: Promise<PdfGateEnvelope> = client.sendEnvelope({
  id: 'env_1',
});
const getEnvelopePromise: Promise<PdfGateEnvelope> = client.getEnvelope({
  id: 'env_1',
});
const flattenFieldNamesPromise: Promise<PdfGateDocument> = client.flattenPdf({
  documentId: 'doc_1',
  fieldNames: ['name', 'email'],
});
const addFormFieldsPromise: Promise<PdfGateDocument> = client.addFormFields({
  documentId: 'doc_1',
  fieldOverrides: { signature: { role: 'signer' } },
  fields: [
    {
      name: 'date',
      type: DocumentFieldType.DATE,
      page: 1,
      x: 10,
      y: 20,
      width: 100,
      height: 30,
    },
  ],
});
const deleteDocumentPromise: Promise<void> = client.deleteDocument({ documentId: 'doc_1' });
const createWebhookPromise: Promise<WebhookResponse> = client.createWebhook({
  url: 'https://example.com/hook',
  eventTypes: [WebhookEventType.ENVELOPE_COMPLETED],
});
const getWebhookPromise: Promise<WebhookResponse> = client.getWebhook({ id: 'wh_1' });
const deleteWebhookPromise: Promise<void> = client.deleteWebhook({ id: 'wh_1' });
const embeddedEnvelopePromise: Promise<PdfGateEnvelope> = client.createEnvelope({
  requesterName: 'John Doe',
  documents: [
    {
      sourceDocumentId: 'doc_1',
      name: 'Agreement',
      recipients: [{ recipientId: 'rec_1', role: 'signer', embedded: true }],
    },
  ],
});
const createEmbedLinkPromise: Promise<EmbedLinkResponse> = client.createEmbedLink({
  id: 'env_1',
  documentId: 'doc_1',
  recipientId: 'rec_1',
  returnUrl: 'https://example.com/done',
});
const createRecipientPromise: Promise<PdfGateRecipient> = client.createRecipient({
  email: 'anna@example.com',
  name: 'Anna Smith',
  metadata: { customerId: 'cus_1' },
});
const listRecipientsPromise: Promise<ListRecipientsResponse> = client.listRecipients({
  email: 'anna@example.com',
});
const getRecipientPromise: Promise<PdfGateRecipient> = client.getRecipient({ id: 'rec_1' });
const updateRecipientPromise: Promise<PdfGateRecipient> = client.updateRecipient({
  id: 'rec_1',
  name: 'Anna Smith-Jones',
});

void generatePromise;
void flattenPromise;
void compressPromise;
void watermarkPromise;
void protectPromise;
void createEnvelopePromise;
void sendEnvelopePromise;
void getEnvelopePromise;
void flattenFieldNamesPromise;
void addFormFieldsPromise;
void deleteDocumentPromise;
void createWebhookPromise;
void getWebhookPromise;
void deleteWebhookPromise;
void embeddedEnvelopePromise;
void createEmbedLinkPromise;
void createRecipientPromise;
void listRecipientsPromise;
void getRecipientPromise;
void updateRecipientPromise;
// @ts-expect-error updateRecipient must not accept an email (it is immutable).
client.updateRecipient({ id: 'rec_1', email: 'new@example.com' });
const verifyResult: WebhookEvent = verifySignature(
  'whsecret_test',
  't=1,v1=abcd',
  Buffer.from('{}')
);
const staticVerifyResult: WebhookEvent = PdfGate.verifySignature(
  'whsecret_test',
  't=1,v1=abcd',
  Buffer.from('{}')
);
void verifyResult;
void staticVerifyResult;

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
client.createEnvelope({
  requesterName: 'John Doe',
  documents: [
    {
      sourceDocumentId: 'doc_1',
      name: 'Agreement',
      recipients: [{ email: 'anna@example.com', name: 'Anna Smith' }],
    },
  ],
  // @ts-expect-error jsonResponse must not be part of public API.
  jsonResponse: true,
});
// @ts-expect-error jsonResponse must not be part of public API.
client.addFormFields({ documentId: 'doc_1', jsonResponse: true });
