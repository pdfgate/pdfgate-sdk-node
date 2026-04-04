const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  getCreatedEnvelope,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('sendEnvelope acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let envelope = null;

  before(async () => {
    envelope = await getCreatedEnvelope(client);
  });

  test('sendEnvelope sends an existing envelope', async () => {
    const sentEnvelope = await client.sendEnvelope({
      id: envelope.id,
    });

    assert.equal(sentEnvelope.id, envelope.id);
    assert.equal(sentEnvelope.status, 'in_progress');
    assert.ok(sentEnvelope.createdAt instanceof Date);
    assert.ok(Array.isArray(sentEnvelope.documents));
    assert.ok(sentEnvelope.documents.length >= 1);
    assert.deepEqual(sentEnvelope.metadata, {
      customerId: 'cus_123',
      department: 'sales',
    });
  });

  test('sendEnvelope error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.sendEnvelope({
          id: 'missing-envelope-id',
        });
      },
      assertApiError
    );
  });
}
