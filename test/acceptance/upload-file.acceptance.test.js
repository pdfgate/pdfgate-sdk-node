const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdfBytes,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('uploadFile acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let samplePdf = null;

  before(async () => {
    samplePdf = await getSamplePdfBytes(client);
  });

  test('uploadFile uploads a PDF from file bytes', async () => {
    const { pdfBytes } = samplePdf;

    const doc = await client.uploadFile({
      file: {
        name: 'generated.pdf',
        data: pdfBytes,
      },
    });

    assertDocumentShape(doc, { type: 'uploaded' });
  });

  test('uploadFile uploads a PDF from URL when file is not provided', async () => {
    const { generatedPdf } = samplePdf;

    const doc = await client.uploadFile({
      url: generatedPdf.fileUrl,
    });

    assertDocumentShape(doc, { type: 'uploaded' });
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

    assertDocumentShape(doc, { type: 'uploaded' });
  });

  test('uploadFile error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.uploadFile({
          url: 'not-a-valid-url',
        });
      },
      assertApiError
    );
  });
}
