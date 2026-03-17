import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  inline?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, inline }) => {
  const [error, setError] = useState<string | null>(null);
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: inline ? 150 : 250, height: inline ? 150 : 250 },
          aspectRatio: inline ? 1.77 : 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            setScannedValue(decodedText);
            // Stop scanner after successful scan
            html5QrCode.stop().then(() => {
              setTimeout(() => {
                onScan(decodedText);
              }, 800);
            }).catch(err => console.error("Error stopping scanner", err));
          },
          (errorMessage) => {
            // Ignore common errors like "No QR code found"
          }
        );
      } catch (err) {
        console.error("Error starting scanner", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner on cleanup", err));
      }
    };
  }, [onScan, inline]);

  if (inline) {
    return (
      <div className="relative w-full h-full bg-black">
        <div id={scannerId} className="w-full h-full" />
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-30 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
        >
          <X className="w-5 h-5" />
        </button>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 p-4 text-red-600 text-xs text-center">
            {error}
          </div>
        )}
        {scannedValue && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20 backdrop-blur-[2px] z-20">
            <div className="bg-white px-4 py-2 rounded-xl shadow-xl border-2 border-emerald-500 flex flex-col items-center gap-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span className="text-sm font-bold text-gray-900">{scannedValue}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <p className="text-sm text-gray-500 mt-1">Position the code within the frame</p>
        </div>

        <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border-4 border-emerald-500/50 shadow-inner">
          <div id={scannerId} className="w-full h-full" />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner Borders */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
            
            {/* Scanning Line */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-[scan_2s_ease-in-out_infinite]" />
            
            {/* Scanned Value Feedback */}
            <AnimatePresence>
              {scannedValue && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-emerald-600/20 backdrop-blur-[2px] z-20"
                >
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-emerald-500 flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <span className="text-lg font-bold text-gray-900">{scannedValue}</span>
                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Scanned!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
