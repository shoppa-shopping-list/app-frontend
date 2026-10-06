interface BackButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}
export interface TelegramApp {
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
