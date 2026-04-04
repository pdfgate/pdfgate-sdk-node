const assert = require('node:assert/strict');
const test = require('node:test');
const EventEmitter = require('node:events');
const https = require('node:https');
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
