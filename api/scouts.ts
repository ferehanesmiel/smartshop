import express from 'express';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

const router = express.Router();

// POST /scouts/places/add
router.post('/places/add', async (req, res) => {
  const { name, category, location, addedBy, photos } = req.body;
  try {
    const placeRef = await addDoc(collection(db, 'places'), {
      name,
      category,
      location,
      addedBy,
      photos,
      verified: false,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: placeRef.id, message: 'Place added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scouts/places
router.get('/places', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'places'));
    const places = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(places);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scouts/places/:id
router.get('/places/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const placeDoc = await getDoc(doc(db, 'places', id));
    if (!placeDoc.exists()) return res.status(404).json({ error: 'Place not found' });
    res.json(placeDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /scouts/places/:id
router.put('/places/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const placeRef = doc(db, 'places', id);
    await updateDoc(placeRef, { ...updates, updatedAt: new Date().toISOString() });
    res.json({ message: 'Place updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scouts/places/verify
router.post('/places/verify', async (req, res) => {
  const { placeId, verified } = req.body;
  try {
    const placeRef = doc(db, 'places', placeId);
    await updateDoc(placeRef, { verified, updatedAt: new Date().toISOString() });
    res.json({ message: 'Place verification updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scouts/tasks/create
router.post('/tasks/create', async (req, res) => {
  const { title, description, reward_sbr } = req.body;
  try {
    const taskRef = await addDoc(collection(db, 'tasks'), {
      title,
      description,
      reward_sbr,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: taskRef.id, message: 'Task created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scouts/tasks
router.get('/tasks', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scouts/tasks/submit
router.post('/tasks/submit', async (req, res) => {
  const { taskId, userId, data } = req.body;
  try {
    const submissionRef = await addDoc(collection(db, 'submissions'), {
      taskId,
      userId,
      data,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: submissionRef.id, message: 'Task submitted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scouts/tasks/submissions
router.get('/tasks/submissions', async (req, res) => {
  const { taskId } = req.query;
  try {
    let q = collection(db, 'submissions');
    if (taskId) {
      q = query(q, where('taskId', '==', taskId)) as any;
    }
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /scouts/tasks/approve
router.post('/tasks/approve', async (req, res) => {
  const { submissionId, status } = req.body; // status: 'approved' or 'rejected'
  try {
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) return res.status(404).json({ error: 'Submission not found' });

    const data = submissionDoc.data();
    await updateDoc(submissionRef, { status, updatedAt: new Date().toISOString() });

    if (status === 'approved') {
      // Reward the scout
      const taskDoc = await getDoc(doc(db, 'tasks', data.taskId));
      const taskData = taskDoc.data();
      if (taskData) {
        const walletRef = doc(db, 'wallets', data.userId);
        const walletDoc = await getDoc(walletRef);
        if (walletDoc.exists()) {
          const walletData = walletDoc.data();
          await updateDoc(walletRef, {
            balance_sbr: walletData.balance_sbr + taskData.reward_sbr,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    res.json({ message: `Submission ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
