import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /orders/create
router.post('/create', async (req, res) => {
  const { user_id, shop_id, products, total_price, payment_method } = req.body;
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      user_id,
      shop_id,
      products,
      total_price,
      payment_method,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('new_order', { id: orderRef.id, shop_id });

    res.status(201).json({ id: orderRef.id, message: 'Order created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:user_id (List orders for a user)
router.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const q = query(collection(db, 'orders'), where('user_id', '==', user_id));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:id (Get single order)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const orderDoc = await getDoc(doc(db, 'orders', id));
    if (!orderDoc.exists()) return res.status(404).json({ error: 'Order not found' });
    res.json(orderDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /orders/:id/status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { status, updatedAt: new Date().toISOString() });

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('delivery_status_update', { orderId: id, status });

    res.json({ message: 'Order status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
