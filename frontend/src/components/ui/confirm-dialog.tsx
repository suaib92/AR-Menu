'use client';

import { useState, useCallback, useRef, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within <ConfirmProvider>');
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);
  const close = useCallback((value: boolean) => {
    setState((s) => {
      if (s) s.resolve(value);
      return null;
    });
  }, []);

  const confirm: ConfirmContextValue = useCallback(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setState({ ...opts, resolve });
      }),
    []
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => close(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e16] border border-white/10 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] w-full max-w-md p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                {state.destructive && (
                  <div className="w-10 h-10 rounded-xl bg-danger/15 text-danger flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2
                    id="confirm-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    {state.title}
                  </h2>
                  {state.description && (
                    <p className="text-sm text-text-muted mt-1.5">
                      {state.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={() => close(false)}
                  size="md"
                >
                  {state.cancelText ?? 'Cancel'}
                </Button>
                <Button
                  variant={state.destructive ? 'danger' : 'primary'}
                  onClick={() => close(true)}
                  size="md"
                  autoFocus
                >
                  {state.confirmText ?? 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
