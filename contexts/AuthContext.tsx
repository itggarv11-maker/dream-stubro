import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { FirebaseUser } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userName: string | null;
  userClass: string | null;
  isPremium: boolean;
  loading: boolean;
  tokens: number | null;
  signup: (email: string, pass: string, name: string, classLevel: string) => Promise<any>;
  login: (email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = tokens !== null && tokens > 500;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserName(data.name || user.displayName || "Explorer");
            setUserClass(data.classLevel || "Class 10");
            setTokens(data.tokens ?? 100);
          } else {
            setTokens(100);
          }
          setLoading(false);
        }, (err) => {
            console.error("Firestore sync error:", err);
            setLoading(false);
        });
        return unsubDoc;
      } else {
        setUserName(null);
        setTokens(null);
        setUserClass(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, pass: string, name: string, classLevel: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    const userRef = doc(db, 'users', res.user.uid);
    await setDoc(userRef, {
        name,
        email,
        classLevel,
        tokens: 100,
        createdAt: new Date().toISOString()
    });
    return res;
  };

  const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

  const loginWithGoogle = async () => {
      const res = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', res.user.uid);
      await setDoc(userRef, {
          name: res.user.displayName,
          email: res.user.email,
          tokens: 100
      }, { merge: true });
      return res;
  };

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    userName,
    userClass,
    isPremium,
    loading,
    tokens,
    signup,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
