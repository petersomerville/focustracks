import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders spinner without text', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('renders spinner with text', () => {
    render(<LoadingSpinner text="Loading..." />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4')
    
    rerender(<LoadingSpinner size="md" />)
    expect(spinner).toHaveClass('h-8', 'w-8')
    
    rerender(<LoadingSpinner size="lg" />)
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('custom-class')
  })
})
