const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  getCreatedEnvelope,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('getEnvelope acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  let envelope = null;

  before(async () => {
    envelope = await getCreatedEnvelope(client);
  });

  test('getEnvelope retrieves an existing envelope by id', async () => {
    const retrievedEnvelope = await client.getEnvelope({
      id: envelope.id,
    });

    assert.equal(retrievedEnvelope.id, envelope.id);
    assert.equal(retrievedEnvelope.status, envelope.status);
    assert.ok(retrievedEnvelope.createdAt instanceof Date);
    assert.ok(Array.isArray(retrievedEnvelope.documents));
    assert.ok(retrievedEnvelope.documents.length >= 1);
    assert.deepEqual(retrievedEnvelope.metadata, {
      customerId: 'cus_123',
      department: 'sales',
    });
  });

  test('getEnvelope error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(
      async () => {
        await client.getEnvelope({
          id: 'missing-envelope-id',
        });
      },
      assertApiError
    );
  });
}
