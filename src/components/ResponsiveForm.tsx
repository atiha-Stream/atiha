'use client'

import React from 'react'
import { FormGrid } from './ResponsiveGrid'

interface ResponsiveFormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
  gridLayout?: boolean
}

export default function ResponsiveForm({ 
  children, 
  onSubmit, 
  className = '',
  gridLayout = false
}: ResponsiveFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
    >
      {gridLayout ? (
        <FormGrid>
          {children}
        </FormGrid>
      ) : (
        children
      )}
    </form>
  )
}

// Composant de champ de formulaire responsive
interface ResponsiveFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  className?: string
}

export function ResponsiveField({ 
  label, 
  children, 
  error, 
  required = false,
  className = ''
}: ResponsiveFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

// Composant d'input responsive
interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: React.ReactNode
}

export function ResponsiveInput({ 
  error, 
  icon, 
  className = '',
  ...props
}: ResponsiveInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <input
        className={`w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
          error ? 'border-red-500' : ''
        } ${icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

// Composant de textarea responsive
interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  icon?: React.ReactNode
}

export function ResponsiveTextarea({ 
  error, 
  icon, 
  className = '',
  ...props
}: ResponsiveTextareaProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-vertical ${
          error ? 'border-red-500' : ''
        } ${icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

// Composant de select responsive
interface ResponsiveSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  icon?: React.ReactNode
  options: { value: string; label: string }[]
}

export function ResponsiveSelect({ 
  error, 
  icon, 
  options,
  className = '',
  ...props
}: ResponsiveSelectProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <select
        className={`w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
          error ? 'border-red-500' : ''
        } ${icon ? 'pl-10' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

// Composant de bouton responsive
interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

export function ResponsiveButton({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ResponsiveButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }
  
  const widthClasses = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

// Composant de groupe de boutons responsive
interface ResponsiveButtonGroupProps {
  children: React.ReactNode
  className?: string
  direction?: 'horizontal' | 'vertical'
}

export function ResponsiveButtonGroup({ 
  children, 
  className = '',
  direction = 'horizontal'
}: ResponsiveButtonGroupProps) {
  const directionClasses = direction === 'horizontal' 
    ? 'flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
    : 'flex flex-col space-y-2'

  return (
    <div className={`${directionClasses} ${className}`}>
      {children}
    </div>
  )
}
