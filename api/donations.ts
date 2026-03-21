import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /donations/create
router.post('/create', async (req, res) => {
  const { title, description, goal_birr } = req.body;
  try {
    const donationRef = await addDoc(collection(db, 'donations'), {
      title,
      description,
      goal_birr,
      raised_birr: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: donationRef.id, message: 'Donation campaign created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /donations
router.get('/', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'donations'));
    const donations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(donations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /donations/contribute
router.post('/contribute', async (req, res) => {
  const { donationId, userId, amount_birr } = req.body;
  try {
    const donationRef = doc(db, 'donations', donationId);
    const donationDoc = await getDoc(donationRef);
    if (!donationDoc.exists()) return res.status(404).json({ error: 'Donation campaign not found' });

    const data = donationDoc.data();
    await updateDoc(donationRef, { raised_birr: data.raised_birr + amount_birr, updatedAt: new Date().toISOString() });

    // Debit the user's wallet
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    if (walletDoc.exists()) {
      const walletData = walletDoc.data();
      if (walletData.balance_birr < amount_birr) return res.status(400).json({ error: 'Insufficient balance' });
      await updateDoc(walletRef, {
        balance_birr: walletData.balance_birr - amount_birr,
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ message: 'Donation contribution successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /donations/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const donationDoc = await getDoc(doc(db, 'donations', id));
    if (!donationDoc.exists()) return res.status(404).json({ error: 'Donation campaign not found' });
    res.json(donationDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
