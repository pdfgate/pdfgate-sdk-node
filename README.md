# PDFGate Node.js SDK

Official npm package for using the [PDFGate](https://pdfgate.com) API from Node.js and TypeScript applications.

Use `pdfgate` to generate PDFs from HTML or URLs, upload and delete stored PDFs, create signing envelopes, manage and verify webhooks, and run PDF operations such as flattening, adding form fields, compression, watermarking, encryption, and form-data extraction.

📘 Documentation: https://pdfgate.com/documentation  
🔑 Dashboard & API keys: https://dashboard.pdfgate.com

---

## Table of contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Create a client](#create-a-client)
- [Quick start](#quick-start)
- [Module formats](#module-formats)
- [Response objects](#response-objects)
- [Examples](#examples)
- [Envelope signing workflows](#envelope-signing-workflows)
- [Managing webhooks](#managing-webhooks)
- [Webhook signature verification](#webhook-signature-verification)
- [Development](#development)
- [Publishing](#publishing)

---

## Installation

```bash
npm install pdfgate
# or
yarn add pdfgate
# or
pnpm add pdfgate
```

---

## Requirements

- Node.js 18 or newer is recommended.
- TypeScript users get bundled types from the package.
- API keys must start with `test_` for sandbox or `live_` for production.

---

## Create a client

```ts
import PdfGate from 'pdfgate';

const client = new PdfGate(process.env.PDFGATE_API_KEY);
```

The SDK selects the API host from the key prefix:

- `test_...` uses the PDFGate sandbox API
- `live_...` uses the PDFGate production API

---

## Quick start

```ts
import PdfGate from 'pdfgate';

const client = new PdfGate(process.env.PDFGATE_API_KEY);

const doc = await client.generatePdf({
  html: '<h1>Hello from PDFGate</h1>',
  preSignedUrlExpiresIn: 3600,
});

console.log(doc.id, doc.fileUrl);

const pdfBuffer = await client.getFile({
  documentId: doc.id,
});
```

---

## Module formats

### ESM

```ts
import PdfGate from 'pdfgate';

const client = new PdfGate(process.env.PDFGATE_API_KEY);
```

### CommonJS

```cjs
const PdfGate = require('pdfgate');

const client = new PdfGate(process.env.PDFGATE_API_KEY);
```

---

## Response objects

PDF processing methods return a typed `PdfGateDocument` object:

- `generatePdf`
- `uploadFile`
- `flattenPdf`
- `addFormFields`
- `compressPdf`
- `watermarkPdf`
- `protectPdf`

The SDK sends `jsonResponse: true` internally for processing endpoints that require it. You do not need to pass that flag yourself.

`deleteDocument` returns `void`.

Envelope methods return `PdfGateEnvelope` objects:

- `createEnvelope`
- `sendEnvelope`
- `getEnvelope`
- `voidEnvelope`

`deleteEnvelope` returns `void`.

Webhook management methods (`createWebhook`, `getWebhook`) return a `WebhookResponse` object; `deleteWebhook` returns `void`.

```ts
const doc = await client.generatePdf({
  url: 'https://example.com',
  preSignedUrlExpiresIn: 3600, // Use this to return fileUrl
});

console.log(doc);
```

Call `getFile` when you need raw PDF bytes.

---

## Examples

### Generate a PDF from a URL

```ts
const doc = await client.generatePdf({
  url: 'https://example.com/',
  scale: 1.3,
  preSignedUrlExpiresIn: 3600,
});

console.log(doc.fileUrl);
```

---

### Generate a PDF from HTML with fillable fields

```ts
const doc = await client.generatePdf({
  html: '<div><p>Hello World</p> <div><input type="text" name="textfield"/></div></div>',
  enableFormFields: true,
});

console.log(doc.id);
```

---

### Get document metadata

```ts
const doc = await client.getDocument({
  id: 'DOCUMENT_ID',
  preSignedUrlExpiresIn: 86400,
});

console.log(doc);
```

---

### Upload a PDF file for later operations

```ts
import fs from 'fs';

const bytes = fs.readFileSync('document.pdf');

const doc = await client.uploadFile({
  file: { name: 'document.pdf', data: Buffer.from(bytes) },
  preSignedUrlExpiresIn: 3600,
});

console.log(doc.id, doc.type); // type = "uploaded"
```

You can also upload from a public URL:

```ts
const doc = await client.uploadFile({
  url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
});
```

When both `file` and `url` are provided, `file` is prioritized and the SDK sends multipart data.

---

### Download a stored PDF file

```ts
import fs from 'fs';

const file = await client.getFile({
  documentId: 'DOCUMENT_ID',
});

fs.writeFileSync('out.pdf', file);
```

---

### Flatten a PDF (make form fields non-editable)

```ts
const doc = await client.flattenPdf({
  documentId: 'DOCUMENT_ID',
  // Optional: flatten only these fields and leave the rest interactive.
  // Omit fieldNames to flatten the whole document.
  fieldNames: ['signature', 'date'],
});

console.log(doc);
```

---

### Add form fields to a PDF

```ts
import { DocumentFieldType } from 'pdfgate';

const doc = await client.addFormFields({
  documentId: 'DOCUMENT_ID',
  // Customize placeholder fields detected in the PDF, keyed by field name.
  fieldOverrides: {
    signature: { role: 'signer', optional: false },
  },
  // Or place fields at explicit positions on a given page.
  fields: [
    {
      name: 'signed_on',
      type: DocumentFieldType.DATE,
      page: 1,
      x: 100,
      y: 650,
      width: 160,
      height: 24,
    },
  ],
});

console.log(doc);
```

---

### Delete a stored document

```ts
await client.deleteDocument({ documentId: 'DOCUMENT_ID' });
```

A document referenced by a draft or in-progress envelope cannot be deleted until those envelopes are completed or expired.

---

### Compress a PDF

```ts
const doc = await client.compressPdf({
  documentId: 'DOCUMENT_ID',
  linearize: false,
});

console.log(doc);
```

---

### Watermark a PDF

```ts
import fs from 'fs';

const font = fs.readFileSync('font.ttf');

const doc = await client.watermarkPdf({
  documentId: 'DOCUMENT_ID',
  type: 'text',
  fontFile: { name: 'font.ttf', data: Buffer.from(font) }, // use your own font file
  text: 'My watermark',
  rotate: 30,
  opacity: 0.3,
});

console.log(doc);
```

---

### Protect (encrypt) a PDF

```ts
const doc = await client.protectPdf({
  documentId: 'DOCUMENT_ID',
  algorithm: 'AES256',
  userPassword: 'user',
  ownerPassword: 'owner',
  disableEditing: true,
  disableCopy: true,
  disablePrint: true,
  encryptMetadata: true,
});

console.log(doc);
```

---

### Extract PDF form data

```ts
const data = await client.extractPdfFormData({
  documentId: 'DOCUMENT_ID',
});

console.log(data);
```

---

## Envelope signing workflows

Use envelopes when a generated PDF needs to be sent to one or more recipients for signing. Each envelope document references a stored source document and defines the recipients that should complete that document.

### Create an envelope with recipient reminders

```ts
const envelope = await client.createEnvelope({
  requesterName: 'John Doe',
  documents: [
    {
      sourceDocumentId: 'DOCUMENT_ID',
      name: 'Employment Agreement',
      recipients: [
        {
          email: 'anna@example.com',
          name: 'Anna Smith',
          role: 'signer',
          reminderIntervalDays: 2,
          reminderAttempts: 3,
        },
      ],
    },
  ],
  metadata: {
    customerId: 'cus_123',
  },
});

console.log(envelope.id, envelope.status);
```

Recipient reminder settings are optional:

- `reminderIntervalDays` controls how many days PDFGate waits between reminder emails.
- `reminderAttempts` controls how many reminders should be sent to the recipient (min 1, max 10, defaults to 5).

Envelope expiration is optional:

- `expiresInDays` controls how many days until the envelope and its signing links expire, counted from creation (min 1, max 90). Defaults to the account's envelope expiration setting.

---

### Send an envelope

```ts
const envelope = await client.sendEnvelope({
  id: 'ENVELOPE_ID',
});

console.log(envelope.id, envelope.status); // status = "in_progress"
```

---

### Get an envelope

```ts
const envelope = await client.getEnvelope({
  id: 'ENVELOPE_ID',
});

console.log(envelope.id, envelope.status);
```

---

### Void an envelope

Cancel an envelope in `created` or `in_progress` status. Recipients who have not signed are notified by email and their signing links stop working; documents already signed by all recipients are not affected.

```ts
const envelope = await client.voidEnvelope({
  id: 'ENVELOPE_ID',
  reason: 'Contract terms changed', // optional, visible to recipients
});

console.log(envelope.status); // "voided"
```

---

### Delete an envelope

Permanently delete an envelope and the files it produced (signed documents and audit logs). Recipient data is anonymized and recipients lose access; source documents are not deleted. Only envelopes in `draft`, `completed`, `expired`, or `voided` status can be deleted — void an active envelope first.

```ts
await client.deleteEnvelope({ id: 'ENVELOPE_ID' });
```

---

## Managing webhooks

Register, retrieve, and delete webhook endpoints that receive PDFGate event notifications.

```ts
import { WebhookEventType } from 'pdfgate';

// Create a webhook. The returned `secret` is shown only once — store it now.
const webhook = await client.createWebhook({
  url: 'https://example.com/pdfgate-callback',
  eventTypes: [WebhookEventType.ENVELOPE_COMPLETED, WebhookEventType.ENVELOPE_SENT],
  description: 'Production signing events',
});

console.log(webhook.id, webhook.secret);

// Retrieve a webhook (the secret is not returned here).
const fetched = await client.getWebhook({ id: webhook.id });
console.log(fetched.status);

// Delete a webhook.
await client.deleteWebhook({ id: webhook.id });
```

The subscribable events are exposed via the `WebhookEventType` enum: `ENVELOPE_SENT`, `ENVELOPE_COMPLETED`, `ENVELOPE_EXPIRED`, and `ENVELOPE_DOCUMENT_COMPLETED`. The webhook URL must be publicly accessible (localhost is not supported).

---

## Webhook signature verification

PDFGate signs webhook requests with the `x-pdfgate-signature` header. Verify that header against the raw request body before trusting the payload.

```ts
import { verifySignature } from 'pdfgate';

const secret = 'whsecret_...';
const signature = req.get('x-pdfgate-signature');

verifySignature(secret, signature, req.body);
```

The verifier expects:

- the raw request body exactly as received
- a `t=...` timestamp in the header
- at least one `v1=...` signature in the header
- a timestamp no older than 5 minutes by default

If verification fails, it throws `PdfGateSignatureVerificationError`.

Example with Express raw body parsing:

```ts
import express from 'express';
import { verifySignature } from 'pdfgate';

const app = express();

app.use(express.raw({ type: 'application/json' }));

app.post('/pdfgate-callback', (req, res) => {
  try {
    const event = verifySignature('whsecret_...', req.get('x-pdfgate-signature'), req.body);
    console.log(event);
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
});
```

During secret rotation PDFGate may send multiple `v1` signatures. The helper considers the webhook valid if any `v1` signature matches.

---

## Development

Install dependencies and run the local checks:

```bash
npm install
npm run build
npm run test:runtime
npm run test:types
npm run lint
```

### Acceptance tests

The acceptance suite calls the real API and requires `PDFGATE_API_KEY`.
If the env var is not set, acceptance tests are skipped with a clear message.

```bash
PDFGATE_API_KEY=test_xxxxx npm run test:acceptance
```

---

## Publishing

Releases are published to npm by GitHub Actions trusted publishing.

1. Update `package.json` to the release version.
2. Merge that commit to `main`.
3. Create and push a matching tag in the format `vX.Y.Z`.

Example:

```bash
git tag v1.0.5
git push origin v1.0.5
```

The publish workflow only runs for tags that match `v*`, and it fails unless the tag version exactly matches `package.json`.
