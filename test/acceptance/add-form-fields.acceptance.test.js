const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  assertDocumentShape,
  createClient,
  getSamplePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('addFormFields acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let samplePdf = null;

  before(async () => {
    samplePdf = await getSamplePdf(client);
  });

  test('addFormFields adds manually positioned fields to a PDF', async () => {
    const doc = await client.addFormFields({
      documentId: samplePdf.id,
      fields: [
        {
          name: 'fullName',
          type: 'text',
          page: 1,
          x: 50,
          y: 500,
          width: 200,
          height: 24,
        },
      ],
    });

    assertDocumentShape(doc, {
      type: 'document_fields_added',
      derivedFrom: samplePdf.id,
    });
  });

  test('addFormFields error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(async () => {
      await client.addFormFields({
        documentId: 'missing-document-id',
      });
    }, assertApiError);
  });
}
