const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('compressPdf acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let generatedPdf = null;

  before(async () => {
    generatedPdf = await getSamplePdf(client);
  });

  test('compressPdf compresses an existing PDF', async () => {
    const doc = await client.compressPdf({
      documentId: generatedPdf.id,
      linearize: true,
    });

    assertDocumentShape(doc, {
      type: 'compressed',
      derivedFrom: generatedPdf.id,
    });
  });

  test('compressPdf error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.compressPdf({
          documentId: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
