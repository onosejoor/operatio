import { API_URL } from '@app/lib/config/env'

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('Resource not found')
      }

      let errorMessage = 'API request failed'
      try {
        const body = await response.json()
        errorMessage = (body as { message?: string }).message || errorMessage
      } catch {
        // Ignore JSON parse errors
      }

      throw new ApiError(errorMessage, response.status)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof TypeError) {
      throw new NetworkError(error.message)
    }

    throw new ApiError('An unexpected error occurred')
  }
}
