# PDFGate Node SDK

Official Node.js client for the [PDFGate](https://pdfgate.com) API.

PDFGate lets you generate, process, and secure PDFs via a simple API:
- HTML or URL to PDF
- Fillable forms
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
- `flattenPdf`
- `compressPdf`
- `watermarkPdf`
- `protectPdf`

This SDK always sends `jsonResponse: true` internally for these methods.

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
