interface BackButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}
export interface DeviceStorage {
  getItem: (
    key: string,
    callback: (error: string | null, value?: string | null) => void,
  ) => unknown;
  setItem: (
    key: string,
    value: string,
    callback: (error: string | null, stored?: boolean) => void,
  ) => unknown;
}
export interface TelegramApp {
  DeviceStorage?: DeviceStorage;
  isVersionAtLeast?: (version: string) => boolean;
  initData: string;
  ready: () => void;
  expand: () => void;
  BackButton: BackButton;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}
declare global {
  interface Window {
    Telegram?: { WebApp: TelegramApp };
  }
}
export function getTelegram(): TelegramApp | undefined {
  return window.Telegram?.WebApp;
}
