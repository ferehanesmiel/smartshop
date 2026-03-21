import express from 'express';
import { db } from '../src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const router = express.Router();

// POST /tracking/update-location (rider sends GPS)
router.post('/update-location', async (req, res) => {
  const { deliveryId, location } = req.body; // location: { lat, lng }
  try {
    const deliveryRef = doc(db, 'deliveries', deliveryId);
    await updateDoc(deliveryRef, { live_location: location, updatedAt: new Date().toISOString() });

    // Emit real-time event via Socket.io
    const io = req.app.get('io');
    io.to(`delivery_${deliveryId}`).emit('rider_location_update', { deliveryId, location });

    res.json({ message: 'Location updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /tracking/:delivery_id
router.get('/:delivery_id', async (req, res) => {
  const { delivery_id } = req.params;
  try {
    const deliveryDoc = await getDoc(doc(db, 'deliveries', delivery_id));
    if (!deliveryDoc.exists()) return res.status(404).json({ error: 'Delivery not found' });
    res.json(deliveryDoc.data().live_location || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
