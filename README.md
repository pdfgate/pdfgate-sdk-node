# PDFGate Node SDK

Official Node.js client for the [PDFGate](https://pdfgate.com) API.

PDFGate lets you generate, process, and secure PDFs via a simple API:
- HTML or URL to PDF
- Upload a PDF to reference it in later operations
- Fillable forms
- Envelopes for signing workflows
- Flatten, compress, watermark, protect PDFs
- Extract PDF form data

📘 Documentation: https://pdfgate.com/documentation  
🔑 Dashboard & API keys: https://dashboard.pdfgate.com

---

## Installation

```bash
npm install pdfgate
# or
yarn add pdfgate
```

---

## Sandbox / Production client

```ts
import PdfGate from 'pdfgate';

const client = new PdfGate('live_xxxxxx'); // Use your production API key
// const client = new PdfGate('test_xxxxxx'); // Use your sandbox API key

```

---

## Quick start

```ts
import PdfGate from 'pdfgate';

const client = new PdfGate(process.env.PDFGATE_API_KEY);

const doc = await client.generatePdf({
  url: 'https://example.com',
});

const pdf = await client.getFile({
  documentId: doc.id,
});
```

---

## Usage with CommonJS

```js
const PdfGate = require('pdfgate');

const client = new PdfGate(process.env.PDFGATE_API_KEY);
```

---

## JSON responses for processing endpoints

The following methods always return a JSON document response (`PdfGateDocument`):

- `generatePdf`
- `uploadFile`
- `flattenPdf`
- `compressPdf`
- `watermarkPdf`
- `protectPdf`

This SDK sends `jsonResponse: true` internally for the processing endpoints that require it. `uploadFile` returns JSON without that flag.

Then `createEnvelope` returns a JSON envelope response (`PdfGateEnvelope`).


```ts
const doc = await client.generatePdf({
  url: 'https://example.com',
  preSignedUrlExpiresIn: 3600, // Use this to return fileUrl
});

console.log(doc);
```

---

## Examples

### Generate PDF from URL

```ts
const doc = await client.generatePdf({
  url: 'https://example.com/',
  scale: 1.3,
  preSignedUrlExpiresIn: 3600,
});

console.log(doc.fileUrl);
```

---

### Generate PDF from HTML with fillable fields

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
});

console.log(doc);
```

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

### Create an envelope

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

## Acceptance tests

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
