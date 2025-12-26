export type ContentType = 'application/json' | 'multipart/form-data';

export interface HttpClientConfig {
  apiKey: string;
  apiUrl: string;
}

export interface HttpRequestParams {
  method: 'GET' | 'POST';
  baseUrl: URL;
  contentType?: ContentType;
  body?: any;
  timeout?: number;
}
