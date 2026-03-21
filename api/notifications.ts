import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// GET /notifications/:user_id
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', user_id));
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /notifications/send
router.post('/send', async (req, res) => {
  const { userId, title, message } = req.body;
  try {
    const notifRef = await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: notifRef.id, message: 'Notification sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /notifications/read
router.put('/read', async (req, res) => {
  const { notificationId } = req.body;
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true, updatedAt: new Date().toISOString() });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
