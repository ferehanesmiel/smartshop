import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold mb-4">Scan QR Code</h2>
        <QrReader
          onResult={(result, error) => {
            if (result) {
              onScan(result.getText());
            }
            if (error) {
              // console.info(error);
            }
          }}
          constraints={{ facingMode: 'environment' }}
          className="w-full rounded-xl overflow-hidden"
        />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default QRScanner;
