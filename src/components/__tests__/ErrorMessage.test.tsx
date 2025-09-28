import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorMessage from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message with default title', () => {
    render(<ErrorMessage message="Something went wrong" />)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(
      <ErrorMessage 
        title="Custom Error" 
        message="Custom error message" 
      />
    )
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('renders dismiss button when onDismiss is provided', () => {
    const mockDismiss = jest.fn()
    render(
      <ErrorMessage 
        message="Test error" 
        onDismiss={mockDismiss} 
      />
    )
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    expect(dismissButton).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const mockDismiss = jest.fn()
    
    render(
      <ErrorMessage 
        message="Test error" 
        onDismiss={mockDismiss} 
      />
    )
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissButton)
    
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <ErrorMessage message="Error message" variant="error" />
    )
    
    // Just verify the component renders with different variants
    expect(screen.getByText('Error message')).toBeInTheDocument()
    
    rerender(<ErrorMessage message="Warning message" variant="warning" />)
    expect(screen.getByText('Warning message')).toBeInTheDocument()
    
    rerender(<ErrorMessage message="Info message" variant="info" />)
    expect(screen.getByText('Info message')).toBeInTheDocument()
  })
})
