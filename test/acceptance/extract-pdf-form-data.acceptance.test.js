const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  getFillablePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('extractPdfFormData acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let fillablePdf = null;

  before(async () => {
    fillablePdf = await getFillablePdf(client);
  });

  test('extractPdfFormData extracts JSON form data', async () => {
    const data = await client.extractPdfFormData({
      documentId: fillablePdf.id,
    });

    assert.ok(data);
    assert.equal(typeof data, 'object');
    assert.ok(!Array.isArray(data));
    assert.ok(Object.prototype.hasOwnProperty.call(data, 'fullName'));
  });

  test('extractPdfFormData error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.extractPdfFormData({
          documentId: 'missing-document-id',
        });
      },
      assertApiError
    );
  });
}
