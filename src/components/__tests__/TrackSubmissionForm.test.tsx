import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TrackSubmissionForm from '../TrackSubmissionForm'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('@/contexts/AuthContext')
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}))
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))
jest.mock('@/lib/logger', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

// Mock ContentPolicyModal
jest.mock('../ContentPolicyModal', () => {
  return function MockContentPolicyModal() {
    return <div data-testid="content-policy-modal">Content Policy</div>
  }
})

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

// Helper function to fill form
async function fillFormWithValidData(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/track title/i), 'Peaceful Piano')
  await user.type(screen.getByLabelText(/artist/i), 'Classical Focus')
  await user.selectOptions(screen.getByLabelText(/genre/i), 'Classical')
  await user.type(screen.getByLabelText(/duration/i), '5:30')
  await user.type(screen.getByLabelText(/youtube url/i), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  await user.type(screen.getByLabelText(/why does this track help with focus/i), 'This track helps with focus because of its calming piano melody.')
}

describe('TrackSubmissionForm', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockSession = {
    access_token: 'mock-token-123'
  }

  const mockUseAuth = useAuth as jest.Mock
  const mockGetSession = supabase.auth.getSession as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockGetSession.mockResolvedValue({
      data: { session: mockSession }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // =============================================================================
  // Rendering Tests
  // =============================================================================

  describe('Rendering', () => {
    it('renders submit track button when user is authenticated', () => {
      render(<TrackSubmissionForm />)
      expect(screen.getByText('Submit Track')).toBeInTheDocument()
    })

    it('does not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null })
      const { container } = render(<TrackSubmissionForm />)
      expect(container.firstChild).toBeNull()
    })

    it('opens modal when submit track button is clicked', async () => {
      const user = userEvent.setup()
      render(<TrackSubmissionForm />)

      const button = screen.getByText('Submit Track')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Submit a Focus Track')).toBeInTheDocument()
      })
    })
  })

  // =============================================================================
  // Form Validation Tests
  // =============================================================================

  describe('Form Validation', () => {
    it('validates that at least one URL is required', async () => {
      const user = userEvent.setup()
      render(<TrackSubmissionForm />)

      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      // Fill form without URLs
      await user.type(screen.getByLabelText(/track title/i), 'Test Track')
      await user.type(screen.getByLabelText(/artist/i), 'Test Artist')
      await user.selectOptions(screen.getByLabelText(/genre/i), 'Ambient')
      await user.type(screen.getByLabelText(/duration/i), '5:30')
      await user.type(screen.getByLabelText(/why does this track help with focus/i), 'This track helps with focus.')

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/at least one platform url.*is required/i)).toBeInTheDocument()
      })
    })
  })

  // =============================================================================
  // Submission Tests
  // =============================================================================

  describe('Form Submission', () => {
    it('submits form successfully with valid data', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Track submitted successfully' })
      })

      render(<TrackSubmissionForm />)
      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      await fillFormWithValidData(user)

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/submissions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token-123'
            })
          })
        )
      })

      expect(toast.success).toHaveBeenCalled()
    })

    it('converts duration to seconds before submitting', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      })

      render(<TrackSubmissionForm />)
      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      await fillFormWithValidData(user)

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.duration).toBe(330) // 5:30 = 330 seconds
    })

    it('handles API error response', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to submit track' })
      })

      render(<TrackSubmissionForm />)
      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      await fillFormWithValidData(user)

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit track')
      })
    })

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success' })
        }), 100))
      )

      render(<TrackSubmissionForm />)
      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      await fillFormWithValidData(user)

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        const submittingButton = screen.getAllByRole('button').find(b => b.textContent === 'Submitting...')
        expect(submittingButton).toBeDisabled()
      })
    })

    it('calls onSubmissionSuccess callback', async () => {
      const mockCallback = jest.fn()
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      })

      render(<TrackSubmissionForm onSubmissionSuccess={mockCallback} />)
      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Track Information')).toBeInTheDocument()
      })

      await fillFormWithValidData(user)

      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(b => b.textContent === 'Submit Track')!
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled()
      })
    })
  })

  // =============================================================================
  // Modal Behavior Tests
  // =============================================================================

  describe('Modal Behavior', () => {
    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<TrackSubmissionForm />)

      await user.click(screen.getByText('Submit Track'))

      await waitFor(() => {
        expect(screen.getByText('Submit a Focus Track')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByText('Submit a Focus Track')).not.toBeInTheDocument()
      })
    })
  })
})
