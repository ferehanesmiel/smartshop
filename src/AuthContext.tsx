import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Shop, User } from './types';
import { handleFirestoreError, OperationType } from './utils/firestoreError';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  userRole: User['role'] | null;
  shop: Shop | null;
  loading: boolean;
  isAdmin: boolean;
  updateLanguage: (lng: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  userRole: null,
  shop: null,
  loading: true,
  isAdmin: false,
  updateLanguage: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    if (user && userData?.user_id) {
      try {
        const userRef = doc(db, 'users', userData.user_id);
        await updateDoc(userRef, { language: lng });
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setShop(null);
        setUserData(null);
        setUserRole(null);
        setIsAdmin(false);
        setLoading(false);
      } else {
        setIsAdmin(user.email === 'esmielferehan@gmail.com');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeShopDoc: (() => void) | undefined;
    let unsubscribeAdmin: (() => void) | undefined;

    // Check if user is an admin
    const adminRef = doc(db, 'admins', user.uid);
    unsubscribeAdmin = onSnapshot(adminRef, (adminDoc) => {
      setIsAdmin(user.email === 'esmielferehan@gmail.com' || adminDoc.exists());
    });

    const userDocRef = doc(db, 'users', user.uid);
    
    unsubscribeUser = onSnapshot(userDocRef, (userSnapshot) => {
      if (userSnapshot.exists()) {
        const uData = { user_id: userSnapshot.id, ...userSnapshot.data() } as User;
        setUserData(uData);
        setUserRole(uData.role);
        
        // Update language if stored in profile
        if (uData.language && i18n.language !== uData.language) {
          i18n.changeLanguage(uData.language);
        }
        
        // Fetch the shop this user belongs to
        if (uData.shop_id) {
          const shopDocRef = doc(db, 'shops', uData.shop_id);
          unsubscribeShopDoc = onSnapshot(shopDocRef, (shopDoc) => {
            if (shopDoc.exists()) {
              setShop({ shopId: shopDoc.id, ...shopDoc.data() } as Shop);
            } else {
              setShop(null);
            }
            setLoading(false);
          });
        } else {
          setShop(null);
          setLoading(false);
        }
      } else {
        // Fallback for legacy owners who might not be in the users collection yet
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('ownerUid', '==', user.uid));
        
        unsubscribeShopDoc = onSnapshot(q, async (querySnapshot) => {
          if (!querySnapshot.empty) {
            setShop({ shopId: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Shop);
            setUserRole('owner');
            setLoading(false);
          } else {
            setShop(null);
            setUserData(null);
            setUserRole(null);
            setLoading(false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'shops');
          setLoading(false);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeShopDoc) unsubscribeShopDoc();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userData, userRole, shop, loading, isAdmin, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
