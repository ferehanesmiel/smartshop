import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /ratings/add
router.post('/add', async (req, res) => {
  const { user_id, shop_id, product_id, rating, comment } = req.body;
  try {
    const ratingRef = await addDoc(collection(db, 'ratings'), {
      user_id,
      shop_id,
      product_id,
      rating,
      comment,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: ratingRef.id, message: 'Rating added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ratings/:entity_id
router.get('/:entity_id', async (req, res) => {
  const { entity_id } = req.params;
  try {
    // Check if it's a shop or product rating
    const qShop = query(collection(db, 'ratings'), where('shop_id', '==', entity_id));
    const qProduct = query(collection(db, 'ratings'), where('product_id', '==', entity_id));

    const [shopSnapshot, productSnapshot] = await Promise.all([
      getDocs(qShop),
      getDocs(qProduct)
    ]);

    const ratings = [
      ...shopSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    res.json(ratings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
