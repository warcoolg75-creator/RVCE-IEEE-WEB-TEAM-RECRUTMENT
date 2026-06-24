import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  variant: "success" | "info" | "error";
  /** Optional inline action (e.g. Undo). */
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => number;
  dismiss: (id: number) => void;
}

let counter = 0;

/** Auto-dismiss delay (ms); the toast progress bar animates over this. */
export const TOAST_DURATION = 3000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // auto-dismiss
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, TOAST_DURATION);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Convenience helpers. */
export const toast = {
  success: (message: string, action?: Toast["action"]) =>
    useToastStore.getState().push({ message, variant: "success", action }),
  info: (message: string, action?: Toast["action"]) =>
    useToastStore.getState().push({ message, variant: "info", action }),
  error: (message: string) =>
    useToastStore.getState().push({ message, variant: "error" }),
};
