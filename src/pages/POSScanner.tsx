import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Product } from '../types';

const POSScanner = () => {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      scanner.clear();
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    setScannedResult(decodedText);
    setLoading(true);
    
    // Search for product by barcode or QR code
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('barcode', '==', decodedText));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const prodData = querySnapshot.docs[0].data() as Product;
      setProduct(prodData);
    } else {
      // Try QR code if barcode not found
      const qQr = query(productsRef, where('qrCode', '==', decodedText));
      const querySnapshotQr = await getDocs(qQr);
      if (!querySnapshotQr.empty) {
        const prodData = querySnapshotQr.docs[0].data() as Product;
        setProduct(prodData);
      } else {
        alert("Product not found");
      }
    }
    setLoading(false);
  };

  const onScanFailure = (error: any) => {
    // console.warn(error);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">POS Scanner</h1>
      <div id="reader" className="w-full max-w-md mx-auto"></div>
      {loading && <p>Searching for product...</p>}
      {product && (
        <div className="mt-4 p-4 border rounded-xl">
          <h2 className="text-xl font-bold">{product.name.en}</h2>
          <p>Price: {product.price}</p>
          <p>Stock: {product.stock}</p>
          <button className="mt-2 bg-brand text-white px-4 py-2 rounded-lg">Add to Cart</button>
        </div>
      )}
    </div>
  );
};

export default POSScanner;
