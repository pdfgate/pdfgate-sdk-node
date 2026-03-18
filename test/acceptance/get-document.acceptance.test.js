const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('getDocument acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let generatedPdf = null;

  before(async () => {
    generatedPdf = await getSamplePdf(client);
  });

  test('getDocument retrieves a document by id', async () => {
    const doc = await client.getDocument({
      id: generatedPdf.id,
      preSignedUrlExpiresIn: 3600,
    });

    assertDocumentShape(doc, { hasFileUrl: true });
    assert.equal(doc.id, generatedPdf.id);
  });

  test('getDocument error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.getDocument({
          id: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
