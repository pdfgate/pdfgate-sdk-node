const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  assertDocumentShape,
  createClient,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('generatePdf acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();

  test('generatePdf creates a PDF from HTML', async () => {
    const doc = await client.generatePdf({
      html: '<html><body><h1>Generate PDF HTML Acceptance Test</h1></body></html>',
      preSignedUrlExpiresIn: 3600,
    });

    assertDocumentShape(doc, { type: 'from_html', hasFileUrl: true });
  });

  test('generatePdf creates a PDF from URL', async () => {
    const doc = await client.generatePdf({
      url: 'https://example.com/',
      preSignedUrlExpiresIn: 3600,
    });

    assertDocumentShape(doc, { type: 'from_html', hasFileUrl: true });
  });

  test("generatePdf rejects when neither 'html' nor 'url' is provided", async () => {
    await assert.rejects(
      async () => {
        await client.generatePdf({});
      },
      (error) => {
        assert.equal(error.name, 'PdfGateApiError');
        assert.match(error.message, /either a 'url' or 'html' parameter/);
        assert.equal(error.statusCode, undefined);
        assert.equal(error.responseBody, undefined);
        assert.equal(error.cause, undefined);
        return true;
      }
    );
  });
}
