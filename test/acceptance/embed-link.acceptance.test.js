const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  getEnvelopeSourcePdf,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('embed link acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  // The recipient is embedded, so sending this envelope delivers no emails.
  let recipient = null;
  let sourceDocument = null;
  let envelope = null;

  before(async () => {
    recipient = await client.createRecipient({
      email: `node-sdk-embed-${Date.now()}@example.com`,
      name: 'Node SDK Embed Acceptance',
    });
    sourceDocument = await getEnvelopeSourcePdf(client);

    envelope = await client.createEnvelope({
      requesterName: 'PDFGate Node SDK Acceptance Tests',
      documents: [
        {
          sourceDocumentId: sourceDocument.id,
          name: 'Embed Agreement',
          recipients: [{ recipientId: recipient.id, embedded: true }],
        },
      ],
    });
  });

  test('createEnvelope resolves the stored recipient and echoes its recipientId', () => {
    const envelopeRecipient = envelope.documents[0].recipients[0];

    assert.equal(envelopeRecipient.recipientId, recipient.id);
    assert.equal(envelopeRecipient.email, recipient.email);
  });

  test('createEmbedLink rejects an envelope that has not been sent', async () => {
    await assert.rejects(
      async () => {
        await client.createEmbedLink({
          id: envelope.id,
          documentId: sourceDocument.id,
          recipientId: recipient.id,
          returnUrl: 'https://example.com/done',
        });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test('createEmbedLink returns a signing url with a 10 minute expiry once sent', async () => {
    await client.sendEnvelope({ id: envelope.id });

    const link = await client.createEmbedLink({
      id: envelope.id,
      documentId: sourceDocument.id,
      recipientId: recipient.id,
      returnUrl: 'https://example.com/done?flow=acceptance',
    });

    assert.equal(typeof link.url, 'string');
    assert.ok(link.url.includes('/embed/sign/'));
    assert.ok(link.expiresAt instanceof Date);

    const minutesUntilExpiry = (link.expiresAt.getTime() - Date.now()) / 60000;
    assert.ok(
      minutesUntilExpiry > 8 && minutesUntilExpiry <= 10.5,
      `expected the link to expire in ~10 minutes, got ${minutesUntilExpiry.toFixed(2)}`
    );
  });

  test('createEmbedLink rejects a voided envelope', async () => {
    await client.voidEnvelope({ id: envelope.id, reason: 'Acceptance test cleanup' });

    await assert.rejects(
      async () => {
        await client.createEmbedLink({
          id: envelope.id,
          documentId: sourceDocument.id,
          recipientId: recipient.id,
          returnUrl: 'https://example.com/done',
        });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        return true;
      }
    );

    await client.deleteEnvelope({ id: envelope.id });
  });
}
