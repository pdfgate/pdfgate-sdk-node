const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const PdfGate = require('../../cjs.cjs');

const apiKey = process.env.PDFGATE_API_KEY;

function assertUploadedDocumentShape(doc) {
  assert.ok(doc.id);
  assert.equal(doc.status, 'completed');
  assert.equal(doc.type, 'uploaded');
  assert.ok(doc.createdAt);
}

async function buildSamplePdf(client) {
  const generatedPdf = await client.generatePdf({
    html: '<html><body><h1>PDFGate Upload Acceptance Test</h1></body></html>',
    preSignedUrlExpiresIn: 3600,
  });

  assert.ok(generatedPdf.fileUrl);

  const pdfBytes = await client.getFile({
    documentId: generatedPdf.id,
  });

  return { generatedPdf, pdfBytes };
}

if (!apiKey) {
  test('uploadFile acceptance tests require PDFGATE_API_KEY', { skip: true }, () => {});
} else {
  const client = new PdfGate(apiKey);
  let samplePdf = null;

  before(async () => {
    samplePdf = await buildSamplePdf(client);
  });

  test('uploadFile uploads a PDF from file bytes', async () => {
    const { pdfBytes } = samplePdf;

    const doc = await client.uploadFile({
      file: {
        name: 'generated.pdf',
        data: pdfBytes,
      },
    });

    assertUploadedDocumentShape(doc);
  });

  test('uploadFile uploads a PDF from URL when file is not provided', async () => {
    const { generatedPdf } = samplePdf;

    const doc = await client.uploadFile({
      url: generatedPdf.fileUrl,
    });

    assertUploadedDocumentShape(doc);
  });

  test('uploadFile prioritizes file when both file and url are provided', async () => {
    const { pdfBytes } = samplePdf;

    const doc = await client.uploadFile({
      file: {
        name: 'generated.pdf',
        data: pdfBytes,
      },
      url: 'not-a-valid-url',
    });

    assertUploadedDocumentShape(doc);
  });

  test('uploadFile error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.uploadFile({
          url: 'not-a-valid-url',
        });
      },
      (error) => {
        assert.equal(error.name, 'PdfGateApiError');
        assert.equal(typeof error.statusCode, 'number');
        assert.ok(error.statusCode >= 400);
        assert.equal(typeof error.responseBody, 'string');
        assert.ok(error.responseBody.length > 0);
        assert.ok(error.cause);
        return true;
      }
    );
  });
}
