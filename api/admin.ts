import express from 'express';
import { db } from '../src/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const shopsSnapshot = await getDocs(collection(db, 'shops'));
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const donationsSnapshot = await getDocs(collection(db, 'donations'));

    res.json({
      total_users: usersSnapshot.size,
      total_shops: shopsSnapshot.size,
      total_orders: ordersSnapshot.size,
      total_donations: donationsSnapshot.size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const total_revenue = ordersSnapshot.docs.reduce((acc, doc) => acc + (doc.data().total_price || 0), 0);
    res.json({ total_revenue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/approve-shop
router.post('/approve-shop', async (req, res) => {
  const { shopId, verified_status } = req.body;
  try {
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, { verified_status, updatedAt: new Date().toISOString() });
    res.json({ message: 'Shop approval updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/approve-place
router.post('/approve-place', async (req, res) => {
  const { placeId, verified } = req.body;
  try {
    const placeRef = doc(db, 'places', placeId);
    await updateDoc(placeRef, { verified, updatedAt: new Date().toISOString() });
    res.json({ message: 'Place approval updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/manage-rewards
router.post('/manage-rewards', async (req, res) => {
  const { userId, amount_sbr, reason } = req.body;
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    if (!walletDoc.exists()) return res.status(404).json({ error: 'Wallet not found' });

    const data = walletDoc.data();
    await updateDoc(walletRef, {
      balance_sbr: data.balance_sbr + amount_sbr,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Rewards managed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
