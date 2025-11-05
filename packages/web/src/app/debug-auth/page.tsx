import { auth } from '@/auth'

export default async function DebugAuth() {
  const session = await auth()
  
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>NextAuth Debug Info</h1>
      
      <h2>Environment Variables:</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'NOT SET'}
GOOGLE_CLIENT_ID: {process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ NOT SET'}
GOOGLE_CLIENT_SECRET: {process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ NOT SET'}
      </pre>

      <h2>Expected Redirect URI:</h2>
      <pre style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', fontSize: '16px' }}>
{process.env.NEXTAUTH_URL}/api/auth/callback/google
      </pre>

      <h2>Current Session:</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
{JSON.stringify(session, null, 2)}
      </pre>

      <div style={{ marginTop: '30px', padding: '20px', background: '#d1ecf1', borderRadius: '8px' }}>
        <h3>📋 Copy this EXACT URI to Google Cloud Console:</h3>
        <input 
          type="text" 
          readOnly 
          value={`${process.env.NEXTAUTH_URL}/api/auth/callback/google`}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '16px',
            border: '2px solid #0c5460',
            borderRadius: '4px'
          }}
          onClick={(e) => {
            e.currentTarget.select()
            navigator.clipboard.writeText(e.currentTarget.value)
          }}
        />
        <p style={{ marginTop: '10px', color: '#0c5460' }}>
          ☝️ Click to select and copy
        </p>
      </div>
    </div>
  )
}
