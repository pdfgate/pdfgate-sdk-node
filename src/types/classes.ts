export type PdfGateApiErrorOptions = {
  statusCode?: number;
  responseBody?: string;
  cause?: unknown;
};

export class PdfGateApiError extends Error {
  statusCode?: number;
  responseBody?: string;
  cause?: unknown;

  constructor(message: string, options: PdfGateApiErrorOptions = {}) {
    super(message);
    this.name = 'PdfGateApiError';
    this.statusCode = options.statusCode;
    this.responseBody = options.responseBody;
    this.cause = options.cause;
  }
}
