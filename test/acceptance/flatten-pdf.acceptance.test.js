const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getFillablePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('flattenPdf acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let fillablePdf = null;

  before(async () => {
    fillablePdf = await getFillablePdf(client);
  });

  test('flattenPdf flattens a fillable PDF', async () => {
    const doc = await client.flattenPdf({
      documentId: fillablePdf.id,
    });

    assertDocumentShape(doc, {
      type: 'flattened',
      derivedFrom: fillablePdf.id,
    });
  });

  test('flattenPdf error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.flattenPdf({
          documentId: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
