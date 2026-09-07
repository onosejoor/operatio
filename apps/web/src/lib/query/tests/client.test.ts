import { describe, it, expect } from 'vitest'
import { createQueryClient } from '@app/lib/query/client'

describe('createQueryClient', () => {
  it('should create a QueryClient with default options', () => {
    const client = createQueryClient()

    expect(client).toBeDefined()
    expect(client.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 5)
    expect(client.getDefaultOptions().queries?.retry).toBe(1)
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false)
  })

  it('should create a new instance each time', () => {
    const client1 = createQueryClient()
    const client2 = createQueryClient()

    expect(client1).not.toBe(client2)
  })
})
