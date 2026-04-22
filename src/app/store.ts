import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '@/features/counter/counterSlice';

export const createAppStore = () =>
  configureStore({
    reducer: {
      counter: counterReducer,
    },
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
