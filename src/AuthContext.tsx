import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Shop } from './types';

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  shop: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setShop(null);
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

    let unsubscribeStaff: (() => void) | undefined;
    let unsubscribeShopDoc: (() => void) | undefined;

    const shopsRef = collection(db, 'shops');
    const q = query(shopsRef, where('ownerUid', '==', user.uid));
    
    const unsubscribeShop = onSnapshot(q, async (querySnapshot) => {
      if (!querySnapshot.empty) {
        setShop({ shopId: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Shop);
        setLoading(false);
      } else {
        // Check if user is a staff member
        const staffRef = collection(db, 'staff');
        const staffQ = query(staffRef, where('email', '==', user.email));
        
        unsubscribeStaff = onSnapshot(staffQ, (staffSnapshot) => {
          if (!staffSnapshot.empty) {
            const staffData = staffSnapshot.docs[0].data();
            // Fetch the shop this staff member belongs to
            const shopDocRef = doc(db, 'shops', staffData.shopId);
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
        }, (error) => {
          console.error("Error listening to staff changes:", error);
          setLoading(false);
        });
      }
    }, (error) => {
      console.error("Error listening to shop changes:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeShop();
      if (unsubscribeStaff) unsubscribeStaff();
      if (unsubscribeShopDoc) unsubscribeShopDoc();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, shop, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
