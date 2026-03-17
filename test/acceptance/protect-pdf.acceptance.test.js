const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('protectPdf acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let generatedPdf = null;

  before(async () => {
    generatedPdf = await getSamplePdf(client);
  });

  test('protectPdf protects an existing PDF', async () => {
    const doc = await client.protectPdf({
      documentId: generatedPdf.id,
      algorithm: 'AES128',
      ownerPassword: 'owner-password',
      userPassword: 'user-password',
      disablePrint: true,
      disableCopy: true,
      disableEditing: true,
    });

    assertDocumentShape(doc, {
      type: 'encrypted',
      derivedFrom: generatedPdf.id,
    });
  });

  test('protectPdf error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.protectPdf({
          documentId: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
