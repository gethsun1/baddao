import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-baddao-primary/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className={cn("w-full max-w-lg relative z-10", className)}
          >
            <Card className="p-6 sm:p-8 flex flex-col shadow-2xl border-baddao-border/80 text-left bg-baddao-card/95 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                {title && <h3 className="text-xl font-display font-bold text-white">{title}</h3>}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-auto cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[70vh] pr-2">
                {children}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
