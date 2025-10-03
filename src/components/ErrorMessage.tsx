'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState, memo } from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
  className?: string
}

const ErrorMessage = memo(function ErrorMessage({
  title = 'Error',
  message,
  onDismiss,
  variant = 'error',
  className = ''
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const variantStyles = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
  }

  const iconStyles = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }

  return (
    <div className={`rounded-md border p-4 ${variantStyles[variant]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${iconStyles[variant]}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm">
            <p>{message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'error' 
                    ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800 focus:ring-red-600' 
                    : variant === 'warning'
                    ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800 focus:ring-yellow-600'
                    : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 focus:ring-blue-600'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ErrorMessage
