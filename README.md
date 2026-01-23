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
import fs from 'fs';

const client = new PdfGate(process.env.PDFGATE_API_KEY);

const pdf = await client.generatePdf({
  url: 'https://example.com',
});

fs.writeFileSync('out.pdf', pdf);
```

---

## Usage with CommonJS

```js
const PdfGate = require('pdfgate');

const client = new PdfGate(process.env.PDFGATE_API_KEY);
```

---

## Buffer vs JSON responses

Most endpoints return **PDF bytes (`Buffer`) by default**. However, if you want a **JSON document response** (with optional `fileUrl`), use the following:

```ts
const doc = await client.generatePdf({
  url: 'https://example.com',
  jsonResponse: true,
  preSignedUrlExpiresIn: 3600, // Use this to return fileUrl
});

console.log(doc);
```

---

## Examples

### Generate PDF from URL

```ts
const pdf = await client.generatePdf({
  url: 'https://example.com/',
  scale: 1.3,
});

fs.writeFileSync('out.pdf', pdf);
```

---

### Generate PDF from HTML with fillable fields

```ts
const pdf = await client.generatePdf({
  html: '<div><p>Hello World</p> <div><input type="text" name="textfield"/></div></div>',
  enableFormFields: true,
});

fs.writeFileSync('out.pdf', pdf);
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
import fs from 'fs';

const input = fs.readFileSync('toflatten.pdf');

const out = await client.flattenPdf({
  file: { name: 'toflatten.pdf', data: Buffer.from(input) },
});

fs.writeFileSync('out.pdf', out);
```

---

### Compress a PDF

```ts
const doc = await client.compressPdf({
  documentId: 'DOCUMENT_ID',
  linearize: false,
  jsonResponse: true,
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

fs.writeFileSync('out.pdf', doc);
```

---

### Protect (encrypt) a PDF

```ts
import fs from 'fs';

const input = fs.readFileSync('input.pdf');

const doc = await client.protectPdf({
  file: { name: 'input.pdf', data: Buffer.from(input) },
  algorithm: 'AES256',
  userPassword: 'user',
  ownerPassword: 'owner',
  disableEditing: true,
  disableCopy: true,
  disablePrint: true,
  encryptMetadata: true,
});

fs.writeFileSync('protected.pdf', doc);
```

---

### Extract PDF form data

```ts
const data = await client.extractPdfFormData({
  documentId: 'DOCUMENT_ID',
});

console.log(data);
```
