'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AdminPermission } from '@/types/admin'
import { hasPermission, getAccessDeniedMessage } from '@/lib/admin-permissions'
import { AccessDeniedNotification } from './AccessDeniedNotification'

interface RestrictedButtonProps {
  href?: string
  onClick?: () => void
  requiredPermission: AdminPermission
  adminPermissions: AdminPermission[]
  children: React.ReactNode
  className?: string
  disabled?: boolean
  title?: string
}

export function RestrictedButton({
  href,
  onClick,
  requiredPermission,
  adminPermissions,
  children,
  className = '',
  disabled = false,
  title
}: RestrictedButtonProps) {
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  
  const hasAccess = hasPermission(adminPermissions, requiredPermission)
  const isDisabled = disabled || !hasAccess

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault()
      setShowAccessDenied(true)
      return
    }
    
    if (onClick) {
      onClick()
    }
  }

  const buttonClasses = `
    ${className}
    ${isDisabled 
      ? 'opacity-50 cursor-not-allowed grayscale' 
      : 'hover:scale-105 transition-all duration-300'
    }
  `.trim()

  const content = (
    <div className={buttonClasses} onClick={handleClick}>
      {children}
    </div>
  )

  if (href && hasAccess) {
    return (
      <>
        <Link href={href} className="group">
          {content}
        </Link>
        <AccessDeniedNotification
          message={getAccessDeniedMessage(adminPermissions, requiredPermission)}
          isVisible={showAccessDenied}
          onClose={() => setShowAccessDenied(false)}
        />
      </>
    )
  }

  return (
    <>
      {content}
      <AccessDeniedNotification
        message={getAccessDeniedMessage(adminPermissions, requiredPermission)}
        isVisible={showAccessDenied}
        onClose={() => setShowAccessDenied(false)}
      />
    </>
  )
}
