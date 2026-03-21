import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /market/shops/create
router.post('/shops/create', async (req, res) => {
  const { ownerId, name, category, place_id, contact, photos } = req.body;
  try {
    const shopRef = await addDoc(collection(db, 'shops'), {
      ownerId,
      name,
      category,
      place_id,
      contact,
      photos,
      verified_status: false,
      plan: 'basic',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: shopRef.id, message: 'Shop created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /market/shops
router.get('/shops', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'shops'));
    const shops = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /market/shops/:id
router.get('/shops/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const shopDoc = await getDoc(doc(db, 'shops', id));
    if (!shopDoc.exists()) return res.status(404).json({ error: 'Shop not found' });
    res.json(shopDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /market/shops/:id
router.put('/shops/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const shopRef = doc(db, 'shops', id);
    await updateDoc(shopRef, { ...updates, updatedAt: new Date().toISOString() });
    res.json({ message: 'Shop updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /market/products/add
router.post('/products/add', async (req, res) => {
  const { shopId, name, description, price, costPrice, stock, category, images } = req.body;
  try {
    const productRef = await addDoc(collection(db, 'products'), {
      shopId,
      name,
      description,
      price,
      costPrice,
      stock,
      category,
      images,
      isPublishedToMarketplace: true,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: productRef.id, message: 'Product added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /market/products
router.get('/products', async (req, res) => {
  const { shopId } = req.query;
  try {
    let q = collection(db, 'products');
    if (shopId) {
      q = query(q, where('shopId', '==', shopId)) as any;
    }
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /market/products/:id
router.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const productDoc = await getDoc(doc(db, 'products', id));
    if (!productDoc.exists()) return res.status(404).json({ error: 'Product not found' });
    res.json(productDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /market/products/:id
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, { ...updates, updatedAt: new Date().toISOString() });
    res.json({ message: 'Product updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /market/products/:id
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
