import React from 'react'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children, session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}
