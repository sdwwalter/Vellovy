// components/ui/PremiumSheet.tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * PremiumSheet — Bottom sheet no mobile, modal centralizado no desktop.
 * SCLC-G: formulários usam sheet, não página nova.
 */
export function PremiumSheet({ open, onClose, title, children, className }: PremiumSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[rgba(44,22,84,0.45)]"
            onClick={onClose}
          />

          {/* Mobile: Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 tablet:hidden",
              "bg-white rounded-t-2xl max-h-[90vh] flex flex-col",
              className
            )}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>

          {/* Desktop: Modal centralizado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-0 z-50 hidden tablet:flex items-center justify-center p-6",
              "pointer-events-none"
            )}
          >
            <div
              className={cn(
                "bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col pointer-events-auto",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
