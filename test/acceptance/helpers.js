const assert = require('node:assert/strict');
const { test } = require('node:test');
const PdfGate = require('../../cjs.cjs');

const apiKey = process.env.PDFGATE_API_KEY;
let samplePdfPromise = null;
let samplePdfBytesPromise = null;
let fillablePdfPromise = null;
let envelopeSourcePdfPromise = null;

function requireAcceptanceApiKey(testName) {
  if (!apiKey) {
    // Register a skipped placeholder so "missing API key" is reported as a skipped test, not silence.
    test(testName, { skip: true }, () => {});
    return false;
  }

  return true;
}

function createClient() {
  return new PdfGate(apiKey);
}

function assertDocumentShape(doc, expected = {}) {
  assert.ok(doc);
  assert.equal(typeof doc.id, 'string');
  assert.ok(doc.id.length > 0);
  assert.equal(doc.status, 'completed');
  assert.ok(doc.createdAt);

  if (expected.type) {
    assert.equal(doc.type, expected.type);
  }

  if (expected.derivedFrom) {
    assert.equal(doc.derivedFrom, expected.derivedFrom);
  }

  if (expected.hasFileUrl) {
    assert.equal(typeof doc.fileUrl, 'string');
    assert.ok(doc.fileUrl.length > 0);
  }
}

function assertApiError(error) {
  assert.equal(error.name, 'PdfGateApiError');
  assert.equal(typeof error.statusCode, 'number');
  assert.ok(error.statusCode >= 400);
  assert.equal(typeof error.responseBody, 'string');
  assert.ok(error.responseBody.length > 0);
  assert.ok(error.cause);
  return true;
}

async function getSamplePdf(client) {
  if (!samplePdfPromise) {
    samplePdfPromise = client.generatePdf({
      html: '<html><body><h1>PDFGate Acceptance Test</h1></body></html>',
      preSignedUrlExpiresIn: 3600,
    });
  }

  const doc = await samplePdfPromise;
  assertDocumentShape(doc, { type: 'from_html' });
  return doc;
}

async function getSamplePdfBytes(client) {
  if (!samplePdfBytesPromise) {
    samplePdfBytesPromise = (async () => {
      const generatedPdf = await getSamplePdf(client);
      const pdfBytes = await client.getFile({
        documentId: generatedPdf.id,
      });

      assertPdfBuffer(pdfBytes);

      return { generatedPdf, pdfBytes };
    })();
  }

  return samplePdfBytesPromise;
}

async function getFillablePdf(client) {
  if (!fillablePdfPromise) {
    fillablePdfPromise = client.generatePdf({
      html: `
        <html>
          <body>
            <form>
              <input type="text" name="fullName" value="Ada Lovelace" />
              <input type="email" name="email" value="ada@example.com" />
              <textarea name="notes">Acceptance test note</textarea>
            </form>
          </body>
        </html>
      `,
      enableFormFields: true,
      preSignedUrlExpiresIn: 3600,
    });
  }

  const doc = await fillablePdfPromise;
  assertDocumentShape(doc, { type: 'from_html' });
  return doc;
}

async function getEnvelopeSourcePdf(client) {
  if (!envelopeSourcePdfPromise) {
    envelopeSourcePdfPromise = client.generatePdf({
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h2>Agreement</h2>
            <p>Please review and complete the required fields below.</p>
            <div style="margin-top: 30px;">
              <label>Full Name</label><br />
              <input type="text" name="recipient-name" style="width: 300px; height: 30px;" />
            </div>
            <div style="margin-top: 30px;">
              <label>Signature</label><br />
              <pdfgate-signature-field name="signature" style="width: 200px; height: 200px;"></pdfgate-signature-field>
            </div>
            <div style="margin-top: 30px;">
              <label>Date</label><br />
              <input type="datetime-local" name="signature-date" pdfgate-auto-fill="true" style="width: 200px; height: 30px;" />
            </div>
          </body>
        </html>
      `,
      enableFormFields: true,
      preSignedUrlExpiresIn: 3600,
    });
  }

  const doc = await envelopeSourcePdfPromise;
  assertDocumentShape(doc, { type: 'from_html' });
  return doc;
}

function assertPdfBuffer(buffer) {
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 0);
  assert.equal(buffer.subarray(0, 5).toString('utf8'), '%PDF-');
}

module.exports = {
  apiKey,
  assertApiError,
  assertDocumentShape,
  assertPdfBuffer,
  createClient,
  getEnvelopeSourcePdf,
  getFillablePdf,
  getSamplePdf,
  getSamplePdfBytes,
  requireAcceptanceApiKey,
};
