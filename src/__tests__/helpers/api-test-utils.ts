/**
 * Utilities for testing Next.js API routes
 *
 * Provides helpers for:
 * - Creating mock NextRequest objects
 * - Parsing NextResponse objects
 * - Common test assertions
 */

import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: unknown
  cookies?: Record<string, string>
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    cookies = {}
  } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  const request = new NextRequest(url, requestInit)

  // Add cookies if provided
  Object.entries(cookies).forEach(([key, value]) => {
    request.cookies.set(key, value)
  })

  return request
}

/**
 * Parse JSON from NextResponse
 */
export async function parseResponse<T = unknown>(response: Response): Promise<{
  status: number
  data: T
}> {
  const data = await response.json()
  return {
    status: response.status,
    data
  }
}

/**
 * Assert that response matches expected API success format
 */
export function expectSuccessResponse<T = unknown>(
  response: { status: number; data: unknown },
  expectedStatus = 200
): asserts response is { status: number; data: { success: true; data: T } } {
  expect(response.status).toBe(expectedStatus)
  expect(response.data).toMatchObject({
    success: true,
    data: expect.anything()
  })
}

/**
 * Assert that response matches expected API error format
 * FocusTracks error format: { error: string, message?: string, code?: string, details?: object }
 */
export function expectErrorResponse(
  response: { status: number; data: unknown },
  expectedStatus: number,
  expectedError?: { message?: string; code?: string }
): asserts response is { status: number; data: { error: string; message?: string; code?: string } } {
  expect(response.status).toBe(expectedStatus)
  expect(response.data).toMatchObject({
    error: expect.any(String)
  })

  if (expectedError?.message) {
    expect((response.data as { message?: string }).message).toBe(expectedError.message)
  }

  if (expectedError?.code) {
    expect((response.data as { code?: string }).code).toBe(expectedError.code)
  }
}

/**
 * Mock Next.js params Promise (Next.js 15 pattern)
 */
export function createMockParams<T extends Record<string, string>>(params: T): Promise<T> {
  return Promise.resolve(params)
}

/**
 * Wait for all promises to resolve (useful for testing async operations)
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve))
}
