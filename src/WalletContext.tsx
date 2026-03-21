import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Wallet } from './types';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  payWithSBR: (amount: number) => Promise<boolean>;
  payWithBirr: (amount: number) => Promise<boolean>;
  addSBR: (amount: number) => Promise<void>;
  addBirr: (amount: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  loading: true,
  payWithSBR: async () => false,
  payWithBirr: async () => false,
  addSBR: async () => {},
  addBirr: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    const walletRef = doc(db, 'wallets', user.uid);
    const unsubscribe = onSnapshot(walletRef, async (docSnap) => {
      if (docSnap.exists()) {
        setWallet({ id: docSnap.id, ...docSnap.data() } as Wallet);
      } else {
        // Initialize wallet if it doesn't exist
        const newWallet: Wallet = {
          id: user.uid,
          user_id: user.uid,
          balance_sbr: 100, // Welcome bonus
          balance_birr: 0,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(walletRef, newWallet);
        setWallet(newWallet);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'wallets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const payWithSBR = async (amount: number) => {
    if (!wallet || wallet.balance_sbr < amount) return false;
    try {
      const walletRef = doc(db, 'wallets', wallet.id);
      await updateDoc(walletRef, {
        balance_sbr: wallet.balance_sbr - amount,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      return false;
    }
  };

  const payWithBirr = async (amount: number) => {
    if (!wallet || wallet.balance_birr < amount) return false;
    try {
      const walletRef = doc(db, 'wallets', wallet.id);
      await updateDoc(walletRef, {
        balance_birr: wallet.balance_birr - amount,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      return false;
    }
  };

  const addSBR = async (amount: number) => {
    if (!wallet) return;
    const walletRef = doc(db, 'wallets', wallet.id);
    await updateDoc(walletRef, {
      balance_sbr: wallet.balance_sbr + amount,
      updatedAt: new Date().toISOString(),
    });
  };

  const addBirr = async (amount: number) => {
    if (!wallet) return;
    const walletRef = doc(db, 'wallets', wallet.id);
    await updateDoc(walletRef, {
      balance_birr: wallet.balance_birr + amount,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <WalletContext.Provider value={{ wallet, loading, payWithSBR, payWithBirr, addSBR, addBirr }}>
      {children}
    </WalletContext.Provider>
  );
};
