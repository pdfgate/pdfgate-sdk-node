const assert = require('node:assert/strict');
const test = require('node:test');
const PdfGate = require('../../cjs.cjs');

const MOCK_DOC = {
  id: 'doc_123',
  status: 'completed',
  type: 'from_html',
  fileUrl: 'https://example.com/file',
  size: 1234,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-02T00:00:00.000Z',
};

function createClientWithPostStub() {
  const client = new PdfGate('test_api_key');

  client.api = {
    post: async (...args) => {
      return MOCK_DOC;
    },
    get: async () => {
      throw new Error('Not used in these tests');
    },
  };

  return client;
}

test("generatePdf keeps validation for required 'url' or 'html'", async () => {
  const client = createClientWithPostStub();

  await assert.rejects(
    () => client.generatePdf({}),
    /You must provide either a 'url' or 'html' parameter/
  );
});
