import express from 'express';
import { db } from '../src/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const router = express.Router();

// GET /wallet/:user_id
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const walletDoc = await getDoc(doc(db, 'wallets', user_id));
    if (!walletDoc.exists()) return res.status(404).json({ error: 'Wallet not found' });
    res.json(walletDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /wallet/transfer
router.post('/transfer', async (req, res) => {
  const { from_user_id, to_user_id, amount_sbr } = req.body;
  try {
    const fromWalletRef = doc(db, 'wallets', from_user_id);
    const toWalletRef = doc(db, 'wallets', to_user_id);

    const fromWalletDoc = await getDoc(fromWalletRef);
    const toWalletDoc = await getDoc(toWalletRef);

    if (!fromWalletDoc.exists() || !toWalletDoc.exists()) {
      return res.status(404).json({ error: 'One or both wallets not found' });
    }

    const fromData = fromWalletDoc.data();
    const toData = toWalletDoc.data();

    if (fromData.balance_sbr < amount_sbr) {
      return res.status(400).json({ error: 'Insufficient SBR balance' });
    }

    // Update balances
    await updateDoc(fromWalletRef, {
      balance_sbr: fromData.balance_sbr - amount_sbr,
      updatedAt: new Date().toISOString()
    });

    await updateDoc(toWalletRef, {
      balance_sbr: toData.balance_sbr + amount_sbr,
      updatedAt: new Date().toISOString()
    });

    // Record transaction
    await addDoc(collection(db, 'transactions'), {
      from_user_id,
      to_user_id,
      amount_sbr,
      type: 'transfer',
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Transfer successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /wallet/convert (SBR ↔ Birr)
router.post('/convert', async (req, res) => {
  const { user_id, amount, direction } = req.body; // direction: 'sbr_to_birr' or 'birr_to_sbr'
  const RATE = 10; // 1 SBR = 10 Birr (example)
  try {
    const walletRef = doc(db, 'wallets', user_id);
    const walletDoc = await getDoc(walletRef);
    if (!walletDoc.exists()) return res.status(404).json({ error: 'Wallet not found' });

    const data = walletDoc.data();

    if (direction === 'sbr_to_birr') {
      if (data.balance_sbr < amount) return res.status(400).json({ error: 'Insufficient SBR' });
      await updateDoc(walletRef, {
        balance_sbr: data.balance_sbr - amount,
        balance_birr: data.balance_birr + (amount * RATE),
        updatedAt: new Date().toISOString()
      });
    } else if (direction === 'birr_to_sbr') {
      if (data.balance_birr < amount) return res.status(400).json({ error: 'Insufficient Birr' });
      await updateDoc(walletRef, {
        balance_birr: data.balance_birr - amount,
        balance_sbr: data.balance_sbr + (amount / RATE),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ message: 'Conversion successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /wallet/transactions/:user_id
router.get('/transactions/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const q = query(collection(db, 'transactions'), where('from_user_id', '==', user_id));
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /wallet/credit
router.post('/credit', async (req, res) => {
  const { user_id, amount_sbr, reason } = req.body;
  try {
    const walletRef = doc(db, 'wallets', user_id);
    const walletDoc = await getDoc(walletRef);
    if (!walletDoc.exists()) return res.status(404).json({ error: 'Wallet not found' });

    const data = walletDoc.data();
    await updateDoc(walletRef, {
      balance_sbr: data.balance_sbr + amount_sbr,
      updatedAt: new Date().toISOString()
    });

    await addDoc(collection(db, 'transactions'), {
      to_user_id: user_id,
      amount_sbr,
      type: 'credit',
      reason,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Wallet credited' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /wallet/debit
router.post('/debit', async (req, res) => {
  const { user_id, amount_sbr, reason } = req.body;
  try {
    const walletRef = doc(db, 'wallets', user_id);
    const walletDoc = await getDoc(walletRef);
    if (!walletDoc.exists()) return res.status(404).json({ error: 'Wallet not found' });

    const data = walletDoc.data();
    if (data.balance_sbr < amount_sbr) return res.status(400).json({ error: 'Insufficient balance' });

    await updateDoc(walletRef, {
      balance_sbr: data.balance_sbr - amount_sbr,
      updatedAt: new Date().toISOString()
    });

    await addDoc(collection(db, 'transactions'), {
      from_user_id: user_id,
      amount_sbr,
      type: 'debit',
      reason,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Wallet debited' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
