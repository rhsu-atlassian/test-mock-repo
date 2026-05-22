export interface HttpClientOptions {
  readonly baseUrl: string;
  readonly defaultHeaders?: Record<string, string>;
  readonly timeoutMs?: number;
}

export interface HttpResponse<T> {
  readonly status: number;
  readonly data: T;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class HttpClient {
  constructor(private readonly options: HttpClientOptions) {}

  async get<T>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, headers);
  }

  async post<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body, headers);
  }

  async patch<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', path, body, headers);
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    const url = `${this.options.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30000);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.options.defaultHeaders,
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = (await response.json()) as T;
      if (!response.ok) {
        throw new HttpError(`Request failed: ${response.status}`, response.status, data);
      }
      return { status: response.status, data };
    } finally {
      clearTimeout(timeout);
    }
  }
}
