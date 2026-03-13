import { useEffect, useState } from 'react';

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const [buffer, setBuffer] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          onScan(buffer);
          setBuffer('');
        }
      } else {
        setBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, onScan]);
};
