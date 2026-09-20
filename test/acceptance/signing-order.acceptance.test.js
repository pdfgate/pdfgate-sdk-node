const assert = require('node:assert/strict');
const { test, before } = require('node:test');
const {
  assertApiError,
  createClient,
  requireAcceptanceApiKey,
} = require('./helpers.js');

if (requireAcceptanceApiKey('signing order acceptance tests require PDFGATE_API_KEY')) {
  const client = createClient();
  // Second recipient is embedded, so only the first (order 1) is emailed.
  let sourceDocument = null;
  let envelope = null;
  let embeddedRecipientId = null;

  before(async () => {
    // two-role document: the shared fixture has role-less fields, which a
    // multi-recipient envelope cannot use
    const generated = await client.generatePdf({
      html: '<html><body><h1>Order</h1>' +
        '<p>First: {signature;n:sig1;r:signer1;w:160;h:48}</p>' +
        '<p>Second: {signature;n:sig2;r:signer2;w:160;h:48}</p>' +
        '</body></html>',
    });
    sourceDocument = await client.addFormFields({ documentId: generated.id });

    envelope = await client.createEnvelope({
      requesterName: 'PDFGate Node SDK Acceptance Tests',
      documents: [
        {
          sourceDocumentId: sourceDocument.id,
          name: 'Signing Order Agreement',
          recipients: [
            { email: 'first-order@example.com', name: 'First Signer', role: 'signer1', signingOrder: 1 },
            { email: `embed-order-${Date.now()}@example.com`, name: 'Second Signer', role: 'signer2', signingOrder: 2, embedded: true },
          ],
        },
      ],
    });
    embeddedRecipientId = envelope.documents[0].recipients[1].recipientId;
  });

  test('createEnvelope stores the signing order on both recipients', () => {
    const [first, second] = envelope.documents[0].recipients;
    assert.equal(first.signingOrder, 1);
    assert.equal(second.signingOrder, 2);
    assert.equal(first.activatedAt, undefined);
  });

  test('rejects a half-ordered document', async () => {
    await assert.rejects(
      async () => {
        await client.createEnvelope({
          requesterName: 'PDFGate Node SDK Acceptance Tests',
          documents: [
            {
              sourceDocumentId: sourceDocument.id,
              name: 'Half Ordered',
              recipients: [
                { email: 'a@example.com', name: 'A', role: 'signer1', signingOrder: 1 },
                { email: 'b@example.com', name: 'B', role: 'signer2' },
              ],
            },
          ],
        });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        return true;
      }
    );
  });

  test('send activates only the first recipient', async () => {
    const sent = await client.sendEnvelope({ id: envelope.id });
    const [first, second] = sent.documents[0].recipients;

    assert.ok(first.activatedAt instanceof Date);
    assert.equal(second.activatedAt, undefined);
  });

  test('createEmbedLink rejects the embedded recipient before its turn', async () => {
    // brief pause — the sandbox allows a small burst on the envelope endpoints
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await assert.rejects(
      async () => {
        await client.createEmbedLink({
          id: envelope.id,
          documentId: sourceDocument.id,
          recipientId: embeddedRecipientId,
          returnUrl: 'https://example.com/done',
        });
      },
      (error) => {
        assertApiError(error);
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /turn to sign/);
        return true;
      }
    );

    await client.voidEnvelope({ id: envelope.id, reason: 'Acceptance test cleanup' });
    await client.deleteEnvelope({ id: envelope.id });
  });
}
