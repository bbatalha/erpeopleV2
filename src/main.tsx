import React from 'react'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './lib/ErrorBoundary.tsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          success: {
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #dcfce7'
            },
            iconTheme: {
              primary: '#16a34a',
              secondary: '#ffffff'
            }
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fee2e2'
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff'
            },
            duration: 6000
          }
        }}
      />
    </ErrorBoundary>
  </StrictMode>,
)