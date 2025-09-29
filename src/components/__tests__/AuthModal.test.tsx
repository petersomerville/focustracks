import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('AuthModal', () => {
  const mockOnClose = jest.fn()
  const mockSignIn = jest.fn()
  const mockSignUp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: jest.fn(),
    })
  })

  it('does not render when isOpen is false', () => {
    render(
      <AuthModal
        isOpen={false}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders login form when isOpen is true and initialMode is login', () => {
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders signup form when initialMode is signup', () => {
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="signup"
      />
    )

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches between login and signup modes', async () => {
    const user = userEvent.setup()

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()

    // Switch to signup
    const signupButton = screen.getByRole('button', { name: 'Sign up' })
    await user.click(signupButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    })

    // Switch back to login
    const loginButton = screen.getByRole('button', { name: 'Sign in' })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('submits login form with correct data', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('submits signup form with correct data', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="signup"
      />
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('displays error message when authentication fails', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ error: null }), 100)
    }))

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()

    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        initialMode="login"
      />
    )

    const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')

    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })
})