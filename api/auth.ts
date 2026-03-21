import express from 'express';
import jwt from 'jsonwebtoken';
import { auth, db } from '../src/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'zemen-digital-city-secret';

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email,
      name,
      role: role || 'customer',
      createdAt: new Date().toISOString()
    });

    // Create wallet for user
    await setDoc(doc(db, 'wallets', user.uid), {
      id: user.uid,
      user_id: user.uid,
      balance_sbr: 100, // Welcome bonus
      balance_birr: 0,
      updatedAt: new Date().toISOString()
    });

    const token = jwt.sign({ uid: user.uid, email: user.email, role: role || 'customer' }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: { uid: user.uid, email: user.email, name, role: role || 'customer' }, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    const token = jwt.sign({ uid: user.uid, email: user.email, role: userData?.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: { uid: user.uid, email: user.email, ...userData }, token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    await signOut(auth);
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/me
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userDoc = await getDoc(doc(db, 'users', decoded.uid));
    res.json({ user: { uid: decoded.uid, ...userDoc.data() } });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
