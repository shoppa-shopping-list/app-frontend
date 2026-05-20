import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/">Go home</Link>
    </section>
  );
}
