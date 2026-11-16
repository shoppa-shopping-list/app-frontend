import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import styles from './Sheet.module.scss';

interface SheetProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}
export function Sheet({ title, children, onClose }: SheetProps) {
  const touchStartY = useRef<number | null>(null);
  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') return;
    touchStartY.current = event.clientY;
  };
  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    if (startY !== null && event.clientY - startY > 80) onClose();
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet} aria-describedby={undefined}>
          <header
            className={styles.header}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              touchStartY.current = null;
            }}
          >
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close className={styles.close} aria-label="Close item details">
              <X size={16} />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
