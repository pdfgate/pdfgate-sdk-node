const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertPdfBuffer,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('getFile acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let generatedPdf = null;

  before(async () => {
    generatedPdf = await getSamplePdf(client);
  });

  test('getFile downloads PDF bytes', async () => {
    const file = await client.getFile({
      documentId: generatedPdf.id,
    });

    assertPdfBuffer(file);
  });

  test('getFile error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.getFile({
          documentId: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
