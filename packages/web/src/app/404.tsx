// Minimal custom 404 page for Next.js App Router
export default function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404 – Page Not Found</h1>
      <p style={{ marginTop: '16px', color: '#666' }}>
        Sorry, the page you are looking for does not exist.
      </p>
    </div>
  )
}
