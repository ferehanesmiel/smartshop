import express from 'express';
import { db } from '../src/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const router = express.Router();

// GET /users/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userDoc = await getDoc(doc(db, 'users', id));
    if (!userDoc.exists()) return res.status(404).json({ error: 'User not found' });
    res.json(userDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  try {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, { name, role, updatedAt: new Date().toISOString() });
    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userRef = doc(db, 'users', id);
    await deleteDoc(userRef);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
