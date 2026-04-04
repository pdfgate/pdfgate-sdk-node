const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  getCreatedEnvelope,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('createEnvelope acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let envelope = null;

  before(async () => {
    envelope = await getCreatedEnvelope(client);
  });

  test('createEnvelope creates an envelope from a fillable source document', async () => {
    assert.equal(typeof envelope.id, 'string');
    assert.ok(envelope.id.length > 0);
    assert.equal(envelope.status, 'created');
    assert.ok(envelope.createdAt instanceof Date);
    assert.ok(Array.isArray(envelope.documents));
    assert.ok(envelope.documents.length >= 1);
    assert.deepEqual(envelope.metadata, {
      customerId: 'cus_123',
      department: 'sales',
    });
  });

  test('createEnvelope error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.createEnvelope({
          requesterName: 'PDFGate Node SDK Acceptance Tests',
          documents: [
            {
              sourceDocumentId: 'missing-document-id',
              name: 'Missing Document',
              recipients: [
                {
                  email: 'anna@example.com',
                  name: 'Anna Smith',
                },
              ],
            },
          ],
        });
      },
      assertApiError
    );
  });
}
