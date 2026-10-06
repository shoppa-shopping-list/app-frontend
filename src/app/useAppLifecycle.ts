import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { transfers } from '@/features/transfers/transfersSlice';
import { getTelegram } from '@/shared/telegram/telegram';
import { useAppDispatch, useAppSelector } from './hooks';

export function useAppLifecycle() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((state) => state.transfers.pending);
  const location = useLocation();
  const navigate = useNavigate();
  const hasPending = Object.values(pending).some(Boolean);
  useEffect(() => {
    const telegram = getTelegram();
    telegram?.ready();
    telegram?.expand();
    telegram?.setHeaderColor('#ffffff');
    telegram?.setBackgroundColor('#ffffff');
  }, []);
  useEffect(() => {
    const button = getTelegram()?.BackButton;
    const goBack = () => {
      void navigate('/');
    };
    if (location.pathname === '/') button?.hide();
    else button?.show();
    button?.onClick(goBack);
    return () => {
      button?.offClick(goBack);
    };
  }, [location.pathname, navigate]);
  useEffect(() => {
    const telegram = getTelegram();
    if (hasPending) telegram?.enableClosingConfirmation();
    else telegram?.disableClosingConfirmation();
  }, [hasPending]);
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === 'hidden') dispatch(transfers.cancelWaiting());
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
    };
  }, [dispatch]);
}
