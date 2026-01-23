export class PdfGateApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfGateApiError';
  }
}
