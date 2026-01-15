import { db, auth } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    doc, 
    getDoc, 
    updateDoc, 
    query,
    orderBy,
    getDocs,
    increment
} from 'firebase/firestore';

const getUser = () => auth?.currentUser;

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Blob) return "[Media Data]"; 
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  
  const newObj: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val !== undefined && typeof val !== 'function') {
      newObj[key] = cleanForFirestore(val);
    }
  }
  return newObj;
}

export const checkTokens = async (): Promise<boolean> => {
    const user = getUser();
    if (!user) return false;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;
    const tokens = snap.data().tokens ?? 100;
    // Unlimited check: Premium or active tokens
    return tokens > 0 || tokens > 500; 
};

export const deductToken = async () => {
    const user = getUser();
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    // Premium unlimited bypass (status 500+ marks premium)
    if (snap.exists() && (snap.data().tokens || 0) > 500) {
        return; 
    }

    await updateDoc(userRef, {
        tokens: increment(-1)
    });
};

export const saveActivity = async (
    type: string, 
    topic: string, 
    subject: string, 
    data: any,
    analysis?: any,
    sessionId?: string | null
) => {
    if (!db) return;
    const user = getUser();
    if (!user) return;

    const activityData = {
        type,
        topic: topic || "Neural Link Session",
        subject: subject || "General",
        sessionId: sessionId || "standalone",
        timestamp: serverTimestamp(),
        data: cleanForFirestore(data),
        analysis: cleanForFirestore(analysis) || {}
    };

    try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        await addDoc(historyRef, activityData);
    } catch (e) {
        console.error("Cloud Save Failure:", e);
    }
};

export const getFullHistory = async () => {
    const user = getUser();
    if (!db || !user) return [];
    try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            date: doc.data().timestamp?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
        }));
    } catch (e) { 
        console.error("History sync failed:", e);
        return []; 
    }
};

export const getPersonalMetrics = async () => {
    const user = getUser();
    if (!db || !user) return null;
    try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'personal', 'metrics'));
        return snap.exists() ? snap.data() : null;
    } catch (e) { return null; }
};