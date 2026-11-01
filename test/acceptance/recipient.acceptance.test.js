const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assertApiError, createClient, requireAcceptanceApiKey } = require('./helpers.js');

if (requireAcceptanceApiKey('recipient acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  // Emails are not unique in the recipient directory, so use a per-run email
  // to keep the list assertions deterministic across repeated runs.
  const email = `node-sdk-acceptance-${Date.now()}@example.com`;
  let recipient = null;

  test('createRecipient stores the recipient and lowercases the email', async () => {
    recipient = await client.createRecipient({
      email: email.toUpperCase(),
      name: 'Node SDK Acceptance',
      metadata: { source: 'node-sdk-acceptance' },
    });

    assert.equal(typeof recipient.id, 'string');
    assert.ok(recipient.id.length > 0);
    assert.equal(recipient.email, email);
    assert.equal(recipient.name, 'Node SDK Acceptance');
    assert.deepEqual(recipient.metadata, { source: 'node-sdk-acceptance' });
    assert.ok(recipient.createdAt instanceof Date);
  });

  test('listRecipients finds the recipient by email case-insensitively', async () => {
    const { recipients } = await client.listRecipients({ email: email.toUpperCase() });

    assert.equal(recipients.length, 1);
    assert.equal(recipients[0].id, recipient.id);
  });

  test('getRecipient returns the stored recipient', async () => {
    const fetched = await client.getRecipient({ id: recipient.id });

    assert.equal(fetched.id, recipient.id);
    assert.equal(fetched.email, email);
    assert.equal(fetched.name, 'Node SDK Acceptance');
  });

  test('updateRecipient changes the name and keeps the email', async () => {
    const updated = await client.updateRecipient({
      id: recipient.id,
      name: 'Node SDK Acceptance Updated',
      metadata: { source: 'node-sdk-acceptance', updated: 'yes' },
    });

    assert.equal(updated.id, recipient.id);
    assert.equal(updated.email, email);
    assert.equal(updated.name, 'Node SDK Acceptance Updated');
    assert.deepEqual(updated.metadata, { source: 'node-sdk-acceptance', updated: 'yes' });
  });

  test('requestRecipientSignature emails the enrolment link and returns a pending signature', async () => {
    const pending = await client.requestRecipientSignature({ id: recipient.id });

    assert.equal(pending.id, recipient.id);
    assert.equal(pending.signature.status, 'pending');
    assert.ok(pending.signature.requestedAt instanceof Date);
    assert.equal(pending.signature.useCount, 0);
    assert.equal(pending.signature.image, undefined);
  });

  test('deleteRecipient is refused while an enrolment is pending', async () => {
    await assert.rejects(
      async () => {
        await client.deleteRecipient({ id: recipient.id });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test('removeRecipientSignature cancels the pending enrolment', async () => {
    const removed = await client.removeRecipientSignature({ id: recipient.id });

    assert.equal(removed.id, recipient.id);
    assert.equal(removed.signature.status, 'revoked');
    assert.ok(removed.signature.revokedAt instanceof Date);
  });

  test('deleteRecipient removes the recipient so later reads return 404', async () => {
    const response = await client.deleteRecipient({ id: recipient.id });
    assert.equal(response, undefined);

    await assert.rejects(
      async () => {
        await client.getRecipient({ id: recipient.id });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 404);
        return true;
      }
    );

    const { recipients } = await client.listRecipients({ email });
    assert.equal(recipients.length, 0);
  });

  test('getRecipient returns 404 for an unknown recipient', async () => {
    await assert.rejects(
      async () => {
        await client.getRecipient({ id: '000000000000000000000000' });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 404);
        return true;
      }
    );
  });
}
