"use client"

import * as React from "react"

import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"

interface ResponsiveModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  )
}

interface ResponsiveModalContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function ResponsiveModalContent({
  children,
  className,
  showCloseButton = true,
}: ResponsiveModalContentProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return (
      <DialogContent className={className} showCloseButton={showCloseButton}>
        {children}
      </DialogContent>
    )
  }

  return (
    <DrawerContent className={className}>
      {children}
    </DrawerContent>
  )
}

function ResponsiveModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogHeader className={className} {...props} />
  }

  return <DrawerHeader className={className} {...props} />
}

function ResponsiveModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogFooter className={className} {...props} />
  }

  return <DrawerFooter className={className} {...props} />
}

function ResponsiveModalTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogTitle className={className} {...props} />
  }

  return <DrawerTitle className={className} {...props} />
}

function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogDescription className={className} {...props} />
  }

  return <DrawerDescription className={className} {...props} />
}

function ResponsiveModalTrigger({
  ...props
}: React.ComponentProps<"button">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogTrigger {...props} />
  }

  return <DrawerTrigger {...props} />
}

function ResponsiveModalClose({
  ...props
}: React.ComponentProps<"button">) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (isDesktop) {
    return <DialogClose {...props} />
  }

  return <DrawerClose {...props} />
}

export {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalTrigger,
  ResponsiveModalClose,
}
