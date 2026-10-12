import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import { router } from './app/router';
import { store, storeReady } from './app/store';
import './assets/styles/global.scss';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing');
root.textContent = 'Loading your saved list…';
void storeReady
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <Provider store={store}>
          <MotionConfig reducedMotion="user">
            <RouterProvider router={router} />
          </MotionConfig>
        </Provider>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    root.textContent =
      error instanceof Error ? error.message : 'Could not read saved data. Please reopen Shoppa.';
  });
