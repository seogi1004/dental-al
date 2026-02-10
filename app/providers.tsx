'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ModalProvider } from "@/components/providers/modal-provider";
import { OffModal } from "@/components/modals/off-modal";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ModalProvider>
          {children}
          <OffModal />
          <Toaster />
        </ModalProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
