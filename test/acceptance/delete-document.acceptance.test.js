const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('deleteDocument acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();

  test('deleteDocument deletes a stored document', async () => {
    // Create a dedicated throwaway document so shared fixtures are unaffected.
    const doc = await client.generatePdf({
      html: '<html><body><h1>Delete me</h1></body></html>',
      preSignedUrlExpiresIn: 3600,
    });
    assertDocumentShape(doc, { type: 'from_html' });

    const result = await client.deleteDocument({ documentId: doc.id });
    assert.equal(result, undefined);

    // The document should no longer be retrievable.
    await assert.rejects(async () => {
      await client.getDocument({ id: doc.id });
    }, assertApiError);
  });

  test('deleteDocument error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(async () => {
      await client.deleteDocument({ documentId: 'missing-document-id' });
    }, assertApiError);
  });
}
