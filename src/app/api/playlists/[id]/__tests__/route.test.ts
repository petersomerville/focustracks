/**
 * Integration tests for /api/playlists/[id] route
 *
 * Tests GET, PUT, and DELETE operations for playlist detail endpoint
 *
 * @jest-environment node
 */

import { GET, PUT, DELETE } from '../route'
import {
  createMockSupabaseClient,
  createMockUser,
  createMockPlaylist,
  createMockTrack,
  type MockSupabaseClient
} from '@/__tests__/helpers/supabase-mock'
import {
  createMockRequest,
  parseResponse,
  expectSuccessResponse,
  expectErrorResponse,
  createMockParams
} from '@/__tests__/helpers/api-test-utils'

// Mock the Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn()
}))

// Mock the logger to avoid console spam
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    dbQuery: jest.fn()
  })
}))

describe('/api/playlists/[id]', () => {
  let mockSupabase: MockSupabaseClient
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createServerSupabaseClient } = require('@/lib/supabase-server')

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    createServerSupabaseClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
    mockSupabase.resetMocks()
  })

  // =============================================================================
  // GET /api/playlists/[id]
  // =============================================================================

  describe('GET', () => {
    const validPlaylistId = '12345678-1234-5234-8234-123456789012'
    const mockUser = createMockUser()
    const mockPlaylist = createMockPlaylist({ id: validPlaylistId })
    const mockTracks = [createMockTrack(), createMockTrack({ id: 'track-2', title: 'Track 2' })]

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.mockUser(null)

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 401, {
        message: 'You must be logged in to view playlists',
        code: 'UNAUTHORIZED'
      })
    })

    it('returns 400 for invalid UUID format', async () => {
      mockSupabase.auth.mockUser(mockUser)

      const invalidId = 'not-a-uuid'
      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${invalidId}`
      })
      const params = createMockParams({ id: invalidId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 400, {
        message: 'Playlist ID must be a valid UUID',
        code: 'INVALID_ID'
      })
    })

    it('returns 404 when playlist does not exist', async () => {
      mockSupabase.auth.mockUser(mockUser)
      mockSupabase
        .mockTable('playlists')
        .mockRejectedValue({ message: 'Not found', code: 'PGRST116' })

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 404, {
        message: 'The requested playlist does not exist',
        code: 'NOT_FOUND'
      })
    })

    it('returns 500 on database error', async () => {
      mockSupabase.auth.mockUser(mockUser)
      mockSupabase
        .mockTable('playlists')
        .mockRejectedValue({ message: 'Database connection failed', code: 'CONNECTION_ERROR' })

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 500, {
        message: 'Database query error',
        code: 'DATABASE_ERROR'
      })
    })

    it('successfully fetches playlist with tracks', async () => {
      mockSupabase.auth.mockUser(mockUser)

      // Mock playlist query
      mockSupabase
        .mockTable('playlists')
        .mockResolvedValue(mockPlaylist)

      // Mock playlist_tracks query
      const playlistTracksWithJoin = mockTracks.map((track, index) => ({
        id: `pt-${index}`,
        playlist_id: validPlaylistId,
        track_id: track.id,
        position: index,
        tracks: track
      }))
      mockSupabase
        .mockTable('playlist_tracks')
        .mockResolvedValue(playlistTracksWithJoin)

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectSuccessResponse(result, 200)
      expect(result.data.data).toMatchObject({
        playlist: {
          ...mockPlaylist,
          tracks: mockTracks
        }
      })
    })

    it('handles playlist with no tracks', async () => {
      mockSupabase.auth.mockUser(mockUser)

      mockSupabase
        .mockTable('playlists')
        .mockResolvedValue(mockPlaylist)

      // Empty tracks array
      mockSupabase
        .mockTable('playlist_tracks')
        .mockResolvedValue([])

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await GET(request, { params })
      const result = await parseResponse(response)

      expectSuccessResponse(result, 200)
      expect(result.data.data).toMatchObject({
        playlist: {
          ...mockPlaylist,
          tracks: []
        }
      })
    })
  })

  // =============================================================================
  // PUT /api/playlists/[id]
  // =============================================================================

  describe('PUT', () => {
    const validPlaylistId = '12345678-1234-5234-8234-123456789012'
    const mockUser = createMockUser()
    const mockPlaylist = createMockPlaylist({ id: validPlaylistId })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.mockUser(null)

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: { name: 'Updated Playlist' }
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 401, {
        message: 'You must be logged in to update playlists',
        code: 'UNAUTHORIZED'
      })
    })

    it('returns 400 for invalid request body (missing name)', async () => {
      mockSupabase.auth.mockUser(mockUser)

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: {}
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 400)
    })

    it('returns 400 for invalid request body (name is empty after trim)', async () => {
      mockSupabase.auth.mockUser(mockUser)

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: { name: '   ' } // Only spaces - will be empty after trim
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 400)
    })

    it('returns 404 when playlist does not exist', async () => {
      mockSupabase.auth.mockUser(mockUser)
      mockSupabase
        .mockTable('playlists')
        .mockRejectedValue({ message: 'Not found', code: 'PGRST116' })

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: { name: 'Updated Playlist' }
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 404, {
        message: 'The requested playlist does not exist',
        code: 'NOT_FOUND'
      })
    })

    it('successfully updates playlist name', async () => {
      mockSupabase.auth.mockUser(mockUser)

      const updatedPlaylist = { ...mockPlaylist, name: 'Updated Playlist Name' }
      mockSupabase
        .mockTable('playlists')
        .mockResolvedValue(updatedPlaylist)

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: { name: 'Updated Playlist Name' }
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectSuccessResponse(result, 200)
      expect(result.data.data).toMatchObject({
        playlist: updatedPlaylist
      })
    })

    it('trims whitespace from playlist name', async () => {
      mockSupabase.auth.mockUser(mockUser)

      const updatedPlaylist = { ...mockPlaylist, name: 'Trimmed Name' }
      mockSupabase
        .mockTable('playlists')
        .mockResolvedValue(updatedPlaylist)

      const request = createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`,
        body: { name: '  Trimmed Name  ' }
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await PUT(request, { params })
      const result = await parseResponse(response)

      expectSuccessResponse(result, 200)
    })
  })

  // =============================================================================
  // DELETE /api/playlists/[id]
  // =============================================================================

  describe('DELETE', () => {
    const validPlaylistId = '12345678-1234-5234-8234-123456789012'
    const mockUser = createMockUser()

    it('returns 500 when playlist_tracks deletion fails', async () => {
      mockSupabase.auth.mockUser(mockUser)
      mockSupabase
        .mockTable('playlist_tracks')
        .mockRejectedValue({ message: 'Delete failed', code: 'DELETE_ERROR' })

      const request = createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await DELETE(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 500, {
        message: 'Database delete error',
        code: 'DATABASE_ERROR'
      })
    })

    it('returns 500 when playlist deletion fails', async () => {
      mockSupabase.auth.mockUser(mockUser)

      // playlist_tracks deletion succeeds
      mockSupabase
        .mockTable('playlist_tracks')
        .mockResolvedValue([])

      // playlist deletion fails
      mockSupabase
        .mockTable('playlists')
        .mockRejectedValue({ message: 'Delete failed', code: 'DELETE_ERROR' })

      const request = createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await DELETE(request, { params })
      const result = await parseResponse(response)

      expectErrorResponse(result, 500, {
        message: 'Database delete error',
        code: 'DATABASE_ERROR'
      })
    })

    it('successfully deletes playlist and associated tracks', async () => {
      mockSupabase.auth.mockUser(mockUser)

      // Both deletions succeed
      mockSupabase
        .mockTable('playlist_tracks')
        .mockResolvedValue([])
      mockSupabase
        .mockTable('playlists')
        .mockResolvedValue([])

      const request = createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/playlists/${validPlaylistId}`
      })
      const params = createMockParams({ id: validPlaylistId })

      const response = await DELETE(request, { params })
      const result = await parseResponse(response)

      expectSuccessResponse(result, 200)
      expect(result.data.data).toMatchObject({
        success: true
      })
    })
  })
})
