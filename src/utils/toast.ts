/**
 * Simple, reliable event-based global toast utility
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastPayload {
  id: string;
  message: string;
  type: ToastType;
  durationMs?: number;
}

export function showToast(message: string, type: ToastType = 'info', durationMs = 5000) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<ToastPayload>('academic-app-toast', {
    detail: {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      message,
      type,
      durationMs,
    },
  });
  window.dispatchEvent(event);
}
