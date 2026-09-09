const assert = require('node:assert/strict');
const test = require('node:test');
const EventEmitter = require('node:events');
const https = require('node:https');
const { createHmac } = require('node:crypto');
const PdfGate = require('../../cjs.cjs');
const { verifySignatureInternal } = require('../../dist/cjs/webhooks/verifySignature.js');

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

function withMockedHttpsResponse({ statusCode = 200, headers = {}, body }, run) {
  const originalRequest = https.request;
  let lastRequest = null;

  https.request = (options, callback) => {
    const request = new EventEmitter();
    const response = new EventEmitter();
    const writtenChunks = [];

    request.write = (chunk) => {
      writtenChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    request.end = () => {
      response.statusCode = statusCode;
      response.statusMessage = 'OK';
      response.headers = headers;

      callback(response);
      if (body !== undefined) {
        response.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body));
      }
      response.emit('end');
    };
    request.destroy = (error) => {
      if (error) {
        request.emit('error', error);
      }
    };
    request.setTimeout = () => request;

    request.options = options;
    request.writtenBody = () => Buffer.concat(writtenChunks).toString('utf8');
    lastRequest = request;

    return request;
  };

  return Promise.resolve()
    .then(() => run(() => lastRequest))
    .finally(() => {
      https.request = originalRequest;
    });
}

function buildSignature(secret, timestamp, payload) {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
}

test("generatePdf keeps validation for required 'url' or 'html'", async () => {
  const client = createClientWithPostStub();

  await assert.rejects(
    () => client.generatePdf({}),
    /You must provide either a 'url' or 'html' parameter/
  );
});

test('createEnvelope serializes nested camelCase fields and builds typed response data', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_123',
        status: 'created',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            status: 'pending',
            recipients: [
              {
                email: 'anna@example.com',
                status: 'pending',
                viewedAt: '2026-01-02T00:00:00.000Z',
                fields: [
                  {
                    name: 'signature',
                    type: 'signature',
                  },
                ],
              },
            ],
          },
        ],
        metadata: {
          customerId: 'cus_123',
        },
      }),
    },
    async (getRequest) => {
      const response = await client.createEnvelope({
        requesterName: 'John Doe',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            name: 'Employment Agreement',
            recipients: [
              {
                email: 'anna@example.com',
                name: 'Anna Smith',
                role: 'signer',
              },
            ],
          },
        ],
        metadata: {
          customerId: 'cus_123',
        },
      });

      capturedRequest = getRequest();

      assert.equal(response.status, 'created');
      assert.ok(response.createdAt instanceof Date);
      assert.equal(response.documents[0].sourceDocumentId, 'doc_123');
      assert.ok(response.documents[0].recipients[0].viewedAt instanceof Date);
      assert.equal(response.documents[0].recipients[0].fields[0].type, 'signature');
      assert.deepEqual(response.metadata, { customerId: 'cus_123' });
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.path, '/envelope');
  assert.equal(requestBody.requesterName, 'John Doe');
  assert.equal(requestBody.documents[0].sourceDocumentId, 'doc_123');
  assert.equal(requestBody.documents[0].name, 'Employment Agreement');
  assert.equal(requestBody.documents[0].recipients[0].email, 'anna@example.com');
  assert.equal(requestBody.documents[0].recipients[0].name, 'Anna Smith');
  assert.equal(requestBody.documents[0].recipients[0].role, 'signer');
  assert.deepEqual(requestBody.metadata, { customerId: 'cus_123' });
});

test('createEnvelope omits undefined optional fields recursively', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_omit',
        status: 'created',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [],
      }),
    },
    async (getRequest) => {
      await client.createEnvelope({
        requesterName: 'John Doe',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            name: 'Employment Agreement',
            recipients: [
              {
                email: 'anna@example.com',
                name: 'Anna Smith',
              },
            ],
          },
        ],
      });

      capturedRequest = getRequest();
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(Object.prototype.hasOwnProperty.call(requestBody, 'metadata'), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(requestBody.documents[0].recipients[0], 'role'),
    false
  );
});

test('sendEnvelope posts to the envelope send endpoint and returns the envelope response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_123',
        status: 'in_progress',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            status: 'pending',
            recipients: [
              {
                email: 'anna@example.com',
                status: 'pending',
                fields: [],
              },
            ],
          },
        ],
      }),
    },
    async (getRequest) => {
      const response = await client.sendEnvelope({
        id: 'env_123',
      });

      capturedRequest = getRequest();

      assert.equal(response.id, 'env_123');
      assert.equal(response.status, 'in_progress');
      assert.ok(response.createdAt instanceof Date);
    }
  );

  assert.equal(capturedRequest.options.path, '/envelope/env_123/send');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('getEnvelope fetches the envelope by id and returns the envelope response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_123',
        status: 'created',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            status: 'pending',
            recipients: [
              {
                email: 'anna@example.com',
                status: 'pending',
                fields: [],
              },
            ],
          },
        ],
      }),
    },
    async (getRequest) => {
      const response = await client.getEnvelope({
        id: 'env_123',
      });

      capturedRequest = getRequest();

      assert.equal(response.id, 'env_123');
      assert.equal(response.status, 'created');
      assert.ok(response.createdAt instanceof Date);
    }
  );

  assert.equal(capturedRequest.options.method, 'GET');
  assert.equal(capturedRequest.options.path, '/envelope/env_123');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('flattenPdf forwards fieldNames and requests a JSON response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(MOCK_DOC),
    },
    async (getRequest) => {
      const response = await client.flattenPdf({
        documentId: 'doc_123',
        fieldNames: ['name', 'email'],
      });

      capturedRequest = getRequest();
      assert.equal(response.id, 'doc_123');
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/forms/flatten');
  assert.deepEqual(requestBody.fieldNames, ['name', 'email']);
  assert.equal(requestBody.jsonResponse, true);
});

test('addFormFields posts fieldOverrides and fields to the forms/fields endpoint', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(MOCK_DOC),
    },
    async (getRequest) => {
      const response = await client.addFormFields({
        documentId: 'doc_123',
        fieldOverrides: { signature: { role: 'signer', optional: false } },
        fields: [{ name: 'date', type: 'date', page: 1, x: 10, y: 20, width: 100, height: 30 }],
      });

      capturedRequest = getRequest();
      assert.equal(response.id, 'doc_123');
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/forms/fields');
  assert.equal(requestBody.documentId, 'doc_123');
  assert.equal(requestBody.fieldOverrides.signature.role, 'signer');
  assert.equal(requestBody.fields[0].name, 'date');
  assert.equal(requestBody.jsonResponse, true);
});

test('voidEnvelope posts the reason to the envelope void endpoint and returns the envelope response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_123',
        status: 'voided',
        voidedAt: '2026-01-02T00:00:00.000Z',
        voidReason: 'Contract terms changed',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [],
      }),
    },
    async (getRequest) => {
      const response = await client.voidEnvelope({
        id: 'env_123',
        reason: 'Contract terms changed',
      });

      capturedRequest = getRequest();
      assert.equal(response.id, 'env_123');
      assert.equal(response.status, 'voided');
      assert.equal(response.voidReason, 'Contract terms changed');
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/envelope/env_123/void');
  assert.equal(requestBody.reason, 'Contract terms changed');
});

test('voidEnvelope sends an empty body when no reason is provided', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'env_123', status: 'voided', createdAt: '2026-01-01T00:00:00.000Z', documents: [] }),
    },
    async (getRequest) => {
      await client.voidEnvelope({ id: 'env_123' });
      capturedRequest = getRequest();
    }
  );

  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/envelope/env_123/void');
  assert.deepEqual(JSON.parse(capturedRequest.writtenBody()), {});
});

test('deleteEnvelope sends a DELETE request to the envelope endpoint', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse({ statusCode: 200, headers: {}, body: '' }, async (getRequest) => {
    const response = await client.deleteEnvelope({ id: 'env_123' });
    capturedRequest = getRequest();
    assert.equal(response, undefined);
  });

  assert.equal(capturedRequest.options.method, 'DELETE');
  assert.equal(capturedRequest.options.path, '/envelope/env_123');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('createEnvelope forwards recipientId and embedded and surfaces recipientId in the response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'env_123',
        status: 'created',
        createdAt: '2026-01-01T00:00:00.000Z',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            status: 'pending',
            recipients: [
              {
                recipientId: 'rec_123',
                email: 'anna@example.com',
                status: 'pending',
                fields: [],
              },
            ],
          },
        ],
      }),
    },
    async (getRequest) => {
      const response = await client.createEnvelope({
        requesterName: 'John Doe',
        documents: [
          {
            sourceDocumentId: 'doc_123',
            name: 'Agreement',
            recipients: [{ recipientId: 'rec_123', role: 'signer', embedded: true }],
          },
        ],
      });

      capturedRequest = getRequest();
      assert.equal(response.documents[0].recipients[0].recipientId, 'rec_123');
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  const sentRecipient = requestBody.documents[0].recipients[0];
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/envelope');
  assert.equal(sentRecipient.recipientId, 'rec_123');
  assert.equal(sentRecipient.embedded, true);
  assert.ok(!('email' in sentRecipient));
  assert.ok(!('name' in sentRecipient));
});

test('createEmbedLink posts the embed link request and returns the url and expiry', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'https://document.pdfgate.com/embed/sign/token123',
        expiresAt: '2026-01-01T00:10:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.createEmbedLink({
        id: 'env_123',
        documentId: 'doc_123',
        recipientId: 'rec_123',
        returnUrl: 'https://example.com/done?flow=1',
      });

      capturedRequest = getRequest();
      assert.equal(response.url, 'https://document.pdfgate.com/embed/sign/token123');
      assert.ok(response.expiresAt instanceof Date);
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/envelope/env_123/embed-link');
  assert.deepEqual(requestBody, {
    documentId: 'doc_123',
    recipientId: 'rec_123',
    returnUrl: 'https://example.com/done?flow=1',
  });
});

test('createRecipient posts the recipient to the recipient endpoint and returns the typed response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'rec_123',
        email: 'anna@example.com',
        name: 'Anna Smith',
        metadata: { customerId: 'cus_1' },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.createRecipient({
        email: 'anna@example.com',
        name: 'Anna Smith',
        metadata: { customerId: 'cus_1' },
      });

      capturedRequest = getRequest();
      assert.equal(response.id, 'rec_123');
      assert.equal(response.email, 'anna@example.com');
      assert.ok(response.createdAt instanceof Date);
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/recipient');
  assert.deepEqual(requestBody, {
    email: 'anna@example.com',
    name: 'Anna Smith',
    metadata: { customerId: 'cus_1' },
  });
});

test('listRecipients sends the email as an encoded query parameter', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipients: [
          {
            id: 'rec_123',
            email: 'anna+test@example.com',
            name: 'Anna Smith',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    },
    async (getRequest) => {
      const response = await client.listRecipients({ email: 'anna+test@example.com' });

      capturedRequest = getRequest();
      assert.equal(response.recipients.length, 1);
      assert.equal(response.recipients[0].id, 'rec_123');
    }
  );

  assert.equal(capturedRequest.options.method, 'GET');
  assert.equal(capturedRequest.options.path, '/recipients?email=anna%2Btest%40example.com');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('getRecipient fetches the recipient by id', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'rec_123',
        email: 'anna@example.com',
        name: 'Anna Smith',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.getRecipient({ id: 'rec_123' });

      capturedRequest = getRequest();
      assert.equal(response.id, 'rec_123');
      assert.equal(response.name, 'Anna Smith');
    }
  );

  assert.equal(capturedRequest.options.method, 'GET');
  assert.equal(capturedRequest.options.path, '/recipient/rec_123');
});

test('updateRecipient sends a PATCH with only the name and metadata in the body', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'rec_123',
        email: 'anna@example.com',
        name: 'Anna Smith-Jones',
        metadata: { tier: 'gold' },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.updateRecipient({
        id: 'rec_123',
        name: 'Anna Smith-Jones',
        metadata: { tier: 'gold' },
      });

      capturedRequest = getRequest();
      assert.equal(response.name, 'Anna Smith-Jones');
      assert.ok(response.updatedAt instanceof Date);
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'PATCH');
  assert.equal(capturedRequest.options.path, '/recipient/rec_123');
  assert.deepEqual(requestBody, { name: 'Anna Smith-Jones', metadata: { tier: 'gold' } });
});

test('deleteDocument sends a DELETE request to the document endpoint', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse({ statusCode: 204, headers: {}, body: '' }, async (getRequest) => {
    const response = await client.deleteDocument({ documentId: 'doc_123' });
    capturedRequest = getRequest();
    assert.equal(response, undefined);
  });

  assert.equal(capturedRequest.options.method, 'DELETE');
  assert.equal(capturedRequest.options.path, '/document/doc_123');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('createWebhook posts the webhook config and returns the typed response', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'wh_123',
        url: 'https://example.com/hook',
        eventTypes: ['envelope.completed'],
        status: 'active',
        secret: 'whsec_abc',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.createWebhook({
        url: 'https://example.com/hook',
        eventTypes: ['envelope.completed'],
        description: 'my hook',
      });

      capturedRequest = getRequest();
      assert.equal(response.id, 'wh_123');
      assert.equal(response.secret, 'whsec_abc');
      assert.ok(response.createdAt instanceof Date);
    }
  );

  const requestBody = JSON.parse(capturedRequest.writtenBody());
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.path, '/webhook');
  assert.equal(requestBody.url, 'https://example.com/hook');
  assert.deepEqual(requestBody.eventTypes, ['envelope.completed']);
  assert.equal(requestBody.description, 'my hook');
});

test('getWebhook fetches the webhook by id', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse(
    {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'wh_123',
        url: 'https://example.com/hook',
        eventTypes: ['envelope.sent'],
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    },
    async (getRequest) => {
      const response = await client.getWebhook({ id: 'wh_123' });
      capturedRequest = getRequest();
      assert.equal(response.id, 'wh_123');
      assert.equal(response.status, 'active');
    }
  );

  assert.equal(capturedRequest.options.method, 'GET');
  assert.equal(capturedRequest.options.path, '/webhook/wh_123');
  assert.equal(capturedRequest.writtenBody(), '');
});

test('deleteWebhook sends a DELETE request to the webhook endpoint', async () => {
  const client = new PdfGate('test_api_key');
  let capturedRequest = null;

  await withMockedHttpsResponse({ statusCode: 204, headers: {}, body: '' }, async (getRequest) => {
    const response = await client.deleteWebhook({ id: 'wh_123' });
    capturedRequest = getRequest();
    assert.equal(response, undefined);
  });

  assert.equal(capturedRequest.options.method, 'DELETE');
  assert.equal(capturedRequest.options.path, '/webhook/wh_123');
});

test('verifySignature succeeds when the signature is valid', () => {
  const secret = 'whsecret_test';
  const timestamp = 1712345678;
  const payload = '{"id":"123"}';
  const signature = buildSignature(secret, timestamp, payload);

  assert.deepEqual(
    verifySignatureInternal(secret, `t=${timestamp},v1=${signature}`, Buffer.from(payload), {
      currentTimestamp: timestamp,
    }),
    { id: '123' }
  );
});

test('verifySignature succeeds when one of multiple v1 signatures is valid', () => {
  const secret = 'whsecret_test';
  const timestamp = 1712345678;
  const payload = '{"id":"123"}';
  const signature = buildSignature(secret, timestamp, payload);

  assert.deepEqual(
    verifySignatureInternal(
      secret,
      `t=${timestamp},v1=deadbeef,v1=${signature},v1=badc0ffee`,
      Buffer.from(payload),
      {
        currentTimestamp: timestamp,
      }
    ),
    { id: '123' }
  );
});

test('verifySignature fails when the header is missing a valid signature', () => {
  assert.throws(() => {
    verifySignatureInternal('whsecret_test', 't=1712345678', Buffer.from('{}'), {
      currentTimestamp: 1712345678,
    });
  }, /Missing signature/);
});

test('verifySignature fails when the header is missing the timestamp', () => {
  assert.throws(() => {
    verifySignatureInternal('whsecret_test', 'v1=deadbeef', Buffer.from('{}'), {
      currentTimestamp: 1712345678,
    });
  }, /Missing timestamp/);
});

test('verifySignature fails when the signature is expired', () => {
  const secret = 'whsecret_test';
  const timestamp = 1712345678;
  const payload = '{"id":"evt_123"}';
  const signature = buildSignature(secret, timestamp, payload);

  assert.throws(() => {
    verifySignatureInternal(secret, `t=${timestamp},v1=${signature}`, Buffer.from(payload), {
      currentTimestamp: timestamp + 301,
    });
  }, /Signature expired/);
});

test('verifySignature fails when the signature is invalid', () => {
  assert.throws(() => {
    verifySignatureInternal('whsecret_test', 't=1712345678,v1=deadbeef', Buffer.from('{}'), {
      currentTimestamp: 1712345678,
    });
  }, /Invalid signature/);
});
