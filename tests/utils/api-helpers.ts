import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
export const createMockRequest = (
  url: string,
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest => {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Create request init
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj, init);
};

// Helper to parse JSON response
export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
};

// Helper to assert response status and get JSON
export const expectJsonResponse = async <T>(
  response: Response,
  expectedStatus: number
): Promise<T> => {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`
    );
  }
  return parseJsonResponse<T>(response);
};

// Common response type for API errors
export type ApiError = {
  error: string;
  details?: unknown;
};

// Common response type for success with data
export type ApiSuccess<T> = {
  data: T;
};

// Helper to test authentication required
export const expectUnauthorized = async (response: Response) => {
  const data = await expectJsonResponse<ApiError>(response, 401);
  return data;
};

// Helper to test validation errors
export const expectBadRequest = async (response: Response) => {
  const data = await expectJsonResponse<ApiError>(response, 400);
  return data;
};

// Helper to test not found
export const expectNotFound = async (response: Response) => {
  const data = await expectJsonResponse<ApiError>(response, 404);
  return data;
};
