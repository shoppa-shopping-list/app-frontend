import { Outlet, useMatches } from 'react-router';

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
        <nav>
          {/* кнопка-бурге для выхода в меню списков */}
          <button>иконка</button>
          {/* название списка */}
          <h1>{title}</h1>
          {/* кнопка для перехода в корзину, при нахождении в корзине она меняется на кноку "назад в список" */}
          <button>коризна/назад</button>
        </nav>

        {/* поисковый инпут */}
        <input type="text" />
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        {/* кнопка для добавления товара */}
        <button>добавить товар</button>
      </footer>
    </>
  );
}
