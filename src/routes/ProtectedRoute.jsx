import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({
  children,
  allowedRoles,              
  redirectTo = '/login',     
  forbiddenRedirectTo = '/', 
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (allowedRoles?.length) {
    const role = user?.role
    const hasAccess = role && allowedRoles.includes(role)

    if (!hasAccess) {
      return <Navigate to={forbiddenRedirectTo} replace />
    }
  }

  return children
}
