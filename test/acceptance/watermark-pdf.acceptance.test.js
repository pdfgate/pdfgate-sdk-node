const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('watermarkPdf acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let generatedPdf = null;

  before(async () => {
    generatedPdf = await getSamplePdf(client);
  });

  test('watermarkPdf applies a text watermark', async () => {
    const doc = await client.watermarkPdf({
      documentId: generatedPdf.id,
      type: 'text',
      text: 'Acceptance watermark',
      opacity: 0.3,
      rotate: 30,
    });

    assertDocumentShape(doc, {
      type: 'watermarked',
      derivedFrom: generatedPdf.id,
    });
  });

  test('watermarkPdf error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.watermarkPdf({
          documentId: 'missing-document-id',
          type: 'text',
          text: 'Acceptance watermark',
        });
      },
      assertApiError
    );
  });
}
