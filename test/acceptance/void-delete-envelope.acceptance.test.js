const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  apiKey,
  assertApiError,
  createClient,
  getEnvelopeSourcePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('voidEnvelope/deleteEnvelope acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  // Deliberately not the shared getCreatedEnvelope fixture — voiding and
  // deleting that one would break the send/get envelope tests that reuse it.
  let envelope = null;

  before(async () => {
    const sourceDocument = await getEnvelopeSourcePdf(client);

    envelope = await client.createEnvelope({
      requesterName: 'PDFGate Node SDK Acceptance Tests',
      documents: [
        {
          sourceDocumentId: sourceDocument.id,
          name: 'Void Delete Agreement',
          recipients: [
            {
              email: 'anna@example.com',
              name: 'Anna Smith',
            },
          ],
        },
      ],
      expiresInDays: 10,
    });
  });

  test('createEnvelope sets expiresAt from expiresInDays (fixed 5 days on sandbox)', () => {
    assert.ok(envelope.expiresAt instanceof Date);
    assert.ok(envelope.createdAt instanceof Date);

    // Sandbox keys ignore expiresInDays: sandbox envelopes always expire after 5 days.
    const expectedDays = apiKey.startsWith('test_') ? 5 : 10;
    const actualDays =
      (envelope.expiresAt.getTime() - envelope.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    assert.ok(
      Math.abs(actualDays - expectedDays) < 0.1,
      `expected expiresAt ~${expectedDays} days after createdAt, got ${actualDays.toFixed(3)}`
    );
  });

  test('voidEnvelope voids a created envelope and echoes the reason', async () => {
    const voided = await client.voidEnvelope({
      id: envelope.id,
      reason: 'Acceptance test void',
    });

    assert.equal(voided.id, envelope.id);
    assert.equal(voided.status, 'voided');
    assert.ok(voided.voidedAt instanceof Date);
    assert.equal(voided.voidReason, 'Acceptance test void');
    assert.ok(voided.documents.every((doc) => doc.status === 'voided'));
    assert.ok(
      voided.documents.every((doc) =>
        doc.recipients.every((recipient) => recipient.status === 'voided')
      )
    );
  });

  test('voidEnvelope rejects an already voided envelope', async () => {
    await assert.rejects(
      async () => {
        await client.voidEnvelope({ id: envelope.id });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test('deleteEnvelope deletes a voided envelope', async () => {
    const response = await client.deleteEnvelope({ id: envelope.id });
    assert.equal(response, undefined);
  });

  test('getEnvelope returns 404 for a deleted envelope', async () => {
    await assert.rejects(
      async () => {
        await client.getEnvelope({ id: envelope.id });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 404);
        return true;
      }
    );
  });
}
