"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle mobile keyboard - use visualViewport API for Safari fallback
  // Chrome/Firefox with interactive-widget=resizes-content handle this automatically
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Only apply visualViewport handling on mobile Safari (no interactive-widget support)
    const isMobile = window.innerWidth < 640;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isMobile || !isSafari) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // Adjust content position when keyboard appears/disappears
      const offsetTop = viewport.offsetTop;
      const height = viewport.height;

      // Set CSS custom properties for the dialog to use
      content.style.setProperty('--visual-viewport-height', `${height}px`);
      content.style.setProperty('--visual-viewport-offset', `${offsetTop}px`);

      // If keyboard is open (viewport smaller than window), adjust max-height
      if (height < window.innerHeight * 0.9) {
        content.style.maxHeight = `${height - 20}px`;
        content.style.bottom = '0';
      } else {
        content.style.maxHeight = '';
        content.style.bottom = '';
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Scroll focused input into view when keyboard appears
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Delay to allow keyboard animation to complete
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    };

    content.addEventListener('focusin', handleFocusIn);
    return () => content.removeEventListener('focusin', handleFocusIn);
  }, []);

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        onOpenAutoFocus={(e) => {
          if (onOpenAutoFocus) {
            onOpenAutoFocus(e);
          }
          // Don't prevent focus - let the browser handle it naturally
          // The scrollIntoView handler will adjust position after focus
        }}
        className={cn(
          // Base styles
          "bg-background fixed z-50 w-full max-w-md border-t border-border shadow-lg outline-none",
          // Mobile: bottom sheet with safe keyboard handling
          // Use svh (small viewport) which accounts for browser UI and keyboards
          "inset-x-0 bottom-0 rounded-t-2xl",
          "max-h-[85svh] overflow-y-auto overscroll-contain",
          // Padding with safe area support
          "p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          // Desktop: centered modal
          "sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:rounded-2xl sm:border sm:max-h-[85vh] sm:pb-6",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          // Mobile: slide up, Desktop: zoom
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          "duration-200",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-6 flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-xl font-bold text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
