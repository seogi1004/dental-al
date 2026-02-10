"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { OffModalFormValues } from "@/lib/schemas"
import { StaffData } from "@/types"

type ModalMode = "add" | "edit"
type ModalTab = "leave" | "off"

export interface ModalConfig {
  mode: ModalMode
  defaultTab: ModalTab
  initialData?: Partial<OffModalFormValues>
  meta?: Record<string, any>
  staffData?: StaffData
  onSuccess?: () => void
}

interface ModalContextType {
  isOpen: boolean
  config: ModalConfig
  openModal: (config: ModalConfig) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ModalConfig>({
    mode: "add",
    defaultTab: "leave",
  })

  const openModal = (newConfig: ModalConfig) => {
    setConfig(newConfig)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  return (
    <ModalContext.Provider value={{ isOpen, config, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
