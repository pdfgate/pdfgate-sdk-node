const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assertApiError, createClient, requireAcceptanceApiKey } = require('./helpers.js');

if (requireAcceptanceApiKey('webhook acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();

  test('createWebhook, getWebhook and deleteWebhook manage a webhook end to end', async () => {
    const url = `https://example.com/pdfgate-hook-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const created = await client.createWebhook({
      url,
      eventTypes: ['envelope.completed', 'envelope.sent'],
      description: 'Node SDK acceptance test',
    });

    assert.equal(typeof created.id, 'string');
    assert.ok(created.id.length > 0);
    assert.equal(created.url, url);
    assert.equal(created.status, 'active');
    assert.deepEqual(created.eventTypes.sort(), ['envelope.completed', 'envelope.sent']);
    // The signing secret is only returned at creation time.
    assert.equal(typeof created.secret, 'string');
    assert.ok(created.secret.length > 0);
    assert.ok(created.createdAt instanceof Date);

    try {
      const fetched = await client.getWebhook({ id: created.id });
      assert.equal(fetched.id, created.id);
      assert.equal(fetched.url, url);
      assert.equal(fetched.status, 'active');
      // The secret is not returned outside of creation.
      assert.equal(fetched.secret, undefined);
    } finally {
      const deleted = await client.deleteWebhook({ id: created.id });
      assert.equal(deleted, undefined);
    }

    // After deletion the webhook should no longer be retrievable.
    await assert.rejects(async () => {
      await client.getWebhook({ id: created.id });
    }, assertApiError);
  });

  test('getWebhook error includes statusCode, responseBody and cause', async () => {
    await assert.rejects(async () => {
      await client.getWebhook({ id: 'missing-webhook-id' });
    }, assertApiError);
  });
}
