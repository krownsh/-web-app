import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({ open, onClose, title, description, children, footer }: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-[1.25rem] border-zen-rock bg-[#fffdf8] gap-0 data-[state=open]:duration-300 data-[state=closed]:duration-200"
      >
        <SheetHeader>
          <SheetTitle className="text-zen-text">{title}</SheetTitle>
          <SheetDescription className={description ? 'text-zen-text-light' : 'sr-only'}>
            {description || title}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 overflow-y-auto max-h-[min(60vh,480px)]">{children}</div>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
