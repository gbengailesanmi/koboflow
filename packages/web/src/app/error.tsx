// Minimal custom error page for Next.js App Router
'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>Something went wrong</h1>
      <p style={{ marginTop: '16px', color: '#666' }}>{error?.message || 'An unexpected error occurred.'}</p>
      <button
        style={{
          marginTop: '24px',
          padding: '12px 32px',
          borderRadius: '8px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  )
}
