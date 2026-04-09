"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { Dialog } from "../components/ui/dialog";

interface AlertOptions {
  title?: string;
  onClose?: () => void;
}

interface ConfirmOptions {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
  okVariant?: "primary" | "danger" | "secondary";
}

interface DialogContextType {
  alert: (message: string, options?: AlertOptions) => Promise<void>;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    onClose?: () => void;
  }>({
    isOpen: false,
    message: "",
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    resolve?: (value: boolean) => void;
    okLabel: string;
    cancelLabel: string;
    okVariant: "primary" | "danger" | "secondary";
  }>({
    isOpen: false,
    message: "",
    okLabel: "OK",
    cancelLabel: "Cancel",
    okVariant: "primary",
  });

  const handleConfirmOk = useCallback(() => {
    confirmState.resolve?.(true);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState]);

  const handleConfirmCancel = useCallback(() => {
    confirmState.resolve?.(false);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState]);

  const handleAlertClose = useCallback(() => {
    alertState.onClose?.();
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, [alertState]);

  const alert = useCallback(
    (message: string, options: AlertOptions = {}): Promise<void> => {
      return new Promise((resolve) => {
        setAlertState({
          isOpen: true,
          message,
          title: options.title,
          onClose: () => {
            options.onClose?.();
            resolve();
          },
        });
      });
    },
    []
  );

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          message,
          title: options.title,
          okLabel: options.okLabel || "OK",
          cancelLabel: options.cancelLabel || "Cancel",
          okVariant: options.okVariant || "primary",
          resolve,
        });
      });
    },
    []
  );

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}

      {/* Alert Dialog */}
      <Dialog
        isOpen={alertState.isOpen}
        onClose={handleAlertClose}
        title={alertState.title || "Alert"}
        actions={[
          {
            label: "OK",
            onClick: handleAlertClose,
            variant: "primary",
          },
        ]}
      >
        <p className="text-[var(--color-ink)] whitespace-pre-wrap">
          {alertState.message}
        </p>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        isOpen={confirmState.isOpen}
        onClose={handleConfirmCancel}
        title={confirmState.title || "Confirm"}
        actions={[
          {
            label: confirmState.cancelLabel,
            onClick: handleConfirmCancel,
            variant: "ghost",
          },
          {
            label: confirmState.okLabel,
            onClick: handleConfirmOk,
            variant: confirmState.okVariant,
          },
        ]}
      >
        <p className="text-[var(--color-ink)] whitespace-pre-wrap">
          {confirmState.message}
        </p>
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
