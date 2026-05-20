import { Link, Outlet, useMatches } from 'react-router';

type RouteHandle = {
  title?: string;
};

export function RootLayout() {
  const matches = useMatches();

  const currentMatch = [...matches]
    .reverse()
    .find((match) => (match.handle as RouteHandle | undefined)?.title);

  const title = (currentMatch?.handle as RouteHandle | undefined)?.title ?? 'App';

  return (
    <>
      <header>
        <h1>{title}</h1>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/shopping-list">Shopping List</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}
