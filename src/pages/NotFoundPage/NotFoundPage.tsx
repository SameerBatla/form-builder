import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p className="muted">
        This page doesn’t exist, or the template was removed.{' '}
        <Link to="/">Go to templates</Link>
      </p>
    </main>
  )
}
