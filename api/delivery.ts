import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /delivery/request
router.post('/request', async (req, res) => {
  const { order_id, pickup, dropoff } = req.body;
  try {
    const deliveryRef = await addDoc(collection(db, 'deliveries'), {
      order_id,
      pickup,
      dropoff,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: deliveryRef.id, message: 'Delivery requested' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /delivery/list
router.get('/list', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'deliveries'));
    const deliveries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /delivery/accept
router.post('/accept', async (req, res) => {
  const { deliveryId, runner_id } = req.body;
  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    await updateDoc(deliveryRef, { runner_id, status: 'assigned', updatedAt: new Date().toISOString() });

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('delivery_assigned', { deliveryId, runner_id });

    res.json({ message: 'Delivery accepted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /delivery/update-status
router.post('/update-status', async (req, res) => {
  const { deliveryId, status } = req.body; // status: 'picked_up', 'delivered'
  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    const deliveryDoc = await getDoc(deliveryRef);
    if (!deliveryDoc.exists()) return res.status(404).json({ error: 'Delivery not found' });

    const data = deliveryDoc.data();
    await updateDoc(deliveryRef, { status, updatedAt: new Date().toISOString() });

    if (status === 'delivered') {
      // Update order status as well
      const orderRef = doc(db, 'orders', data.order_id);
      await updateDoc(orderRef, { status: 'delivered', updatedAt: new Date().toISOString() });

      // Reward the rider (example)
      const walletRef = doc(db, 'wallets', data.runner_id);
      const walletDoc = await getDoc(walletRef);
      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        await updateDoc(walletRef, {
          balance_sbr: walletData.balance_sbr + 50, // Delivery reward
          updatedAt: new Date().toISOString()
        });
      }

      // Emit real-time event
      const io = req.app.get('io');
      io.emit('delivery_completed', { deliveryId, orderId: data.order_id });
    }

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /delivery/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deliveryDoc = await getDoc(doc(db, 'deliveries', id));
    if (!deliveryDoc.exists()) return res.status(404).json({ error: 'Delivery not found' });
    res.json(deliveryDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
