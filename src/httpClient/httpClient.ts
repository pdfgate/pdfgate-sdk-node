import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';
import path from 'node:path';
import { ContentType, HttpClientConfig, HttpRequestParams } from './types';
import { PdfGateApiError } from '../types/classes';

export class HttpClient {
  config: HttpClientConfig;
  boundary: string = '----boundary';

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  private findFileContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.ttf':
        return 'font/ttf';
      case '.otf':
        return 'font/otf';
      default:
        throw new Error(
          `Unsupported file type "${ext}". Supported types: .pdf, .png, .jpg, .jpeg, .ttf, .otf`
        );
    }
  }

  private generateFormData(data: Record<string, any>) {
    const chunks: Buffer[] = [];

    for (const [key, value] of Object.entries(data)) {
      chunks.push(Buffer.from(`--${this.boundary}\r\n`));
      if (Buffer.isBuffer(value.data)) {
        chunks.push(
          Buffer.from(
            `Content-Disposition: form-data; name="${key}"; filename="${key}"\r\n` +
              `Content-Type: ${this.findFileContentType(value.name)}\r\n\r\n`
          )
        );
        chunks.push(value.data);
        chunks.push(Buffer.from('\r\n'));
      } else {
        let val = String(value);
        if (typeof value === 'object') {
          val = JSON.stringify(value);
        }
        chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
      }
    }

    chunks.push(Buffer.from(`--${this.boundary}--\r\n`));
    return Buffer.concat(chunks);
  }

  async get<T>(path: string, query?: Record<string, any>): Promise<T> {
    const url = new URL(this.config.apiUrl + path);

    if (query) {
      Object.keys(query).forEach((key) => {
        if (query[key]) {
          url.searchParams.append(key, String(query[key]));
        }
      });
    }

    return this.request<T>({
      method: 'GET',
      baseUrl: url,
    });
  }

  parseJsonSafe(data: string) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  isBinaryFormat(contentType: string) {
    return (
      contentType.includes('application/octet-stream') || contentType.includes('application/pdf')
    );
  }

  async post<T>(path: string, body?: any, contentType?: ContentType, timeout?: number): Promise<T> {
    const url = new URL(this.config.apiUrl + path);

    return this.request<T>({
      method: 'POST',
      baseUrl: url,
      contentType,
      timeout,
      body,
    });
  }

  private request<T>(params: HttpRequestParams): Promise<T> {
    let headers: Record<string, any> = {
      'Content-Type': `application/json`,
    };

    let data: any;
    if (params.contentType === 'multipart/form-data') {
      data = this.generateFormData(params.body);
      headers = {
        'Content-Type': `multipart/form-data; boundary=${this.boundary}`,
        'Content-Length': data.length,
      };
    }

    if (params.body && params.contentType !== 'multipart/form-data') {
      data = JSON.stringify(params.body);
    }

    return new Promise<T>((resolve, reject) => {
      const options: https.RequestOptions = {
        method: params.method,
        hostname: params.baseUrl.host,
        port: 443,
        path: params.baseUrl.pathname + params.baseUrl.search,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          ...headers,
        },
        timeout: params.timeout ?? 60000,
      };

      const transport = https;

      const req = transport.request(options, (response: http.IncomingMessage) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          try {
            const bufferData = Buffer.concat(chunks);
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
              const responseContentType = String(response.headers['content-type'] || '');
              const respData = this.isBinaryFormat(responseContentType)
                ? bufferData
                : this.parseJsonSafe(bufferData?.toString('utf8'));
              resolve(bufferData ? respData : ({} as T));
            } else {
              const apiError = this.parseJsonSafe(bufferData?.toString('utf8'));
              reject(
                new PdfGateApiError(
                  `HTTP Error: status [${response.statusCode}] - ${apiError?.message || response.statusMessage || 'Unknown error'}`
                )
              );
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (err: any) => reject(err));
      req.on('timeout', () => {
        req.destroy(new PdfGateApiError('Request timeout'));
        reject(new PdfGateApiError('Request timeout'));
      });

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }
}
