/**
 * Mock Supabase client for API route testing
 *
 * This module provides utilities for mocking Supabase operations in tests,
 * allowing isolated testing of API routes without hitting real database.
 */

import { User } from '@supabase/supabase-js'
import type { Track, Playlist, PlaylistTrack } from '@/lib/supabase'

// Mock data factories
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  ...overrides
})

export const createMockAdmin = (): User => createMockUser({
  id: 'admin-user-id-456',
  email: 'admin@example.com'
})

export const createMockTrack = (overrides?: Partial<Track>): Track => ({
  id: 'track-id-123',
  title: 'Test Track',
  artist: 'Test Artist',
  genre: 'Ambient',
  duration: 300,
  youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockPlaylist = (overrides?: Partial<Playlist>): Playlist => ({
  id: 'playlist-id-789',
  name: 'Test Playlist',
  user_id: 'test-user-id-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockPlaylistTrack = (overrides?: Partial<PlaylistTrack>): PlaylistTrack => ({
  id: 'playlist-track-id-101',
  playlist_id: 'playlist-id-789',
  track_id: 'track-id-123',
  position: 0,
  ...overrides
})

/**
 * Mock Supabase query builder
 * Implements a chainable API that matches Supabase's query syntax
 */
export class MockSupabaseQueryBuilder<T = unknown> {
  private mockData: T | T[] | null = null
  private mockError: { message: string; code?: string } | null = null
  private selectValue = '*'
  private filters: Record<string, unknown> = {}

  constructor(private tableName: string) {}

  // Configure mock responses
  mockResolvedValue(data: T | T[] | null): this {
    this.mockData = data
    this.mockError = null
    return this
  }

  mockRejectedValue(error: { message: string; code?: string }): this {
    this.mockData = null
    this.mockError = error
    return this
  }

  // Supabase query methods
  select(columns = '*'): this {
    this.selectValue = columns
    return this
  }

  insert(data: Partial<T>): this {
    if (!this.mockData) {
      this.mockData = data as T
    }
    return this
  }

  update(data: Partial<T>): this {
    if (!this.mockData) {
      this.mockData = data as T
    }
    return this
  }

  delete(): this {
    return this
  }

  eq(column: string, value: unknown): this {
    this.filters[column] = value
    return this
  }

  order(_column: string, _options?: { ascending?: boolean }): this {
    return this
  }

  single(): this {
    return this
  }

  // Make the query builder awaitable
  async then<TResult1 = { data: T | T[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    const result = {
      data: this.mockData,
      error: this.mockError
    }

    try {
      if (onfulfilled) {
        return await onfulfilled(result)
      }
      return result as unknown as TResult1
    } catch (error) {
      if (onrejected) {
        return await onrejected(error)
      }
      throw error
    }
  }
}

/**
 * Mock Supabase auth
 */
export class MockSupabaseAuth {
  private _mockUser: User | null = null
  private _mockError: { message: string } | null = null

  mockUser(user: User | null): this {
    this._mockUser = user
    this._mockError = null
    return this
  }

  mockAuthError(error: { message: string }): this {
    this._mockUser = null
    this._mockError = error
    return this
  }

  async getUser(): Promise<{ data: { user: User | null }; error: { message: string } | null }> {
    return {
      data: { user: this._mockUser },
      error: this._mockError
    }
  }

  async getSession(): Promise<{ data: { session: { user: User } | null }; error: { message: string } | null }> {
    return {
      data: { session: this._mockUser ? { user: this._mockUser } : null },
      error: this._mockError
    }
  }
}

/**
 * Mock Supabase client
 */
export class MockSupabaseClient {
  public auth: MockSupabaseAuth
  private tableBuilders: Map<string, MockSupabaseQueryBuilder> = new Map()

  constructor() {
    this.auth = new MockSupabaseAuth()
  }

  from<T = unknown>(table: string): MockSupabaseQueryBuilder<T> {
    // Return existing builder if it was preconfigured, otherwise create new one
    if (this.tableBuilders.has(table)) {
      return this.tableBuilders.get(table) as MockSupabaseQueryBuilder<T>
    }

    // Create a default builder that returns empty data
    const builder = new MockSupabaseQueryBuilder<T>(table)
    builder.mockResolvedValue(null)
    return builder
  }

  // Helper to configure table responses BEFORE the route calls .from()
  mockTable<T = unknown>(table: string): MockSupabaseQueryBuilder<T> {
    const builder = new MockSupabaseQueryBuilder<T>(table)
    this.tableBuilders.set(table, builder as MockSupabaseQueryBuilder)
    return builder
  }

  // Reset all mocks
  resetMocks(): void {
    this.auth = new MockSupabaseAuth()
    this.tableBuilders.clear()
  }
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  return new MockSupabaseClient()
}
