
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc,
  getDocs,
  limit,
  orderBy,
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { LiveQuizRoom, LiveQuizPlayer, LiveQuizQuestion } from '../types';

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * ROOM MANAGEMENT
 */
export const createLiveQuizRoom = async (
  hostName: string, 
  title: string, 
  subject: string, 
  questions: LiveQuizQuestion[], 
  isCrossLevel: boolean = false
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Neural session unauthorized.");

  const roomCode = generateRoomCode();
  const roomRef = doc(collection(db, 'liveQuizRooms'));
  const roomId = roomRef.id;

  const roomData: any = {
    roomCode,
    hostUid: user.uid,
    status: 'lobby',
    isCrossLevel,
    currentQuestionIndex: 0,
    questionStartTime: null,
    title,
    subject,
    createdAt: serverTimestamp()
  };

  await setDoc(roomRef, roomData);

  for (let i = 0; i < questions.length; i++) {
    await setDoc(doc(db, 'liveQuizRooms', roomId, 'questions', i.toString()), questions[i]);
  }

  await joinLiveQuizRoom(roomId, hostName);
  
  // Add AI Bots if Cross-Level is requested to ensure arena is never empty
  if (isCrossLevel) {
    await addAiBot(roomId, "Astra_Bot_Alpha", "Class 8", "Science");
    await addAiBot(roomId, "Neural_Bot_Beta", "Class 11", "Physics");
  }

  return roomId;
};

const addAiBot = async (roomId: string, name: string, classLevel: string, subject: string) => {
  const botUid = `ai_bot_${Math.random().toString(36).substr(2, 5)}`;
  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', botUid);
  await setDoc(playerRef, {
    uid: botUid,
    name: name,
    classLevel,
    subject,
    score: 0,
    isAi: true,
    hasAnswered: false,
    answerTimeMs: 0,
    joinedAt: serverTimestamp()
  });
};

export const findRoomByCode = async (code: string): Promise<string | null> => {
  const q = query(collection(db, 'liveQuizRooms'), where('roomCode', '==', code.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  if (data.status === 'finished') return null;
  return snap.docs[0].id;
};

export const joinLiveQuizRoom = async (roomId: string, playerName: string, classLevel?: string, subject?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Neural link failed.");

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  const playerData: any = {
    uid: user.uid,
    name: playerName,
    classLevel: classLevel || "Any",
    subject: subject || "General",
    score: 0,
    streak: 0,
    hasAnswered: false,
    answerTimeMs: 0,
    isConnected: true,
    isAi: false,
    joinedAt: serverTimestamp()
  };

  await setDoc(playerRef, playerData);
};

/**
 * GAME ACTIONS: Neural Normalization Logic
 */
export const startLiveQuiz = async (roomId: string) => {
  const roomRef = doc(db, 'liveQuizRooms', roomId);
  await updateDoc(roomRef, {
    status: 'live',
    currentQuestionIndex: 0,
    questionStartTime: serverTimestamp()
  });
};

export const submitLiveAnswer = async (roomId: string, isCorrect: boolean, startTime: number) => {
  const user = auth.currentUser;
  if (!user) return;

  const roomSnap = await getDoc(doc(db, 'liveQuizRooms', roomId));
  const isCrossLevel = roomSnap.data()?.isCrossLevel || false;

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) return;

  const data = playerSnap.data();
  const currentScore = data.score || 0;
  const currentStreak = data.streak || 0;
  const playerClass = data.classLevel || "Class 10";

  const answerTimeMs = Date.now() - startTime;
  
  // SKILL SCORE NORMALIZATION (0-100 Per Round)
  // Higher classes have higher complexity weight but lower baseline to normalize with Class 6
  const classModifier = parseInt(playerClass.replace(/\D/g, '')) || 10;
  const difficultyNormalization = 1 + (classModifier / 20); 

  const basePoints = 70; // 70% based on accuracy
  const speedBonus = Math.max(0, 30 * (1 - (answerTimeMs / 15000))); // 30% based on speed
  
  const rawRoundScore = isCorrect ? (basePoints + speedBonus) : 0;
  const normalizedEarned = Math.round(rawRoundScore * difficultyNormalization);

  await updateDoc(playerRef, {
    hasAnswered: true,
    answerTimeMs: answerTimeMs,
    score: currentScore + normalizedEarned,
    streak: isCorrect ? currentStreak + 1 : 0
  });

  return { earnedPoints: normalizedEarned, isCorrect, streak: isCorrect ? currentStreak + 1 : 0 };
};

export const nextLiveQuestion = async (roomId: string, nextIndex: number, totalQuestions: number) => {
  const roomRef = doc(db, 'liveQuizRooms', roomId);
  if (nextIndex >= totalQuestions) {
    await updateDoc(roomRef, { status: 'finished' });
    return;
  }

  const playersSnap = await getDocs(collection(db, 'liveQuizRooms', roomId, 'players'));
  for (const p of playersSnap.docs) {
    const pData = p.data();
    
    // Auto-Simulate AI Bots for next round
    if (pData.isAi) {
      const willBeCorrect = Math.random() > 0.3;
      const simTime = 2000 + Math.random() * 8000;
      const classModifier = parseInt(pData.classLevel.replace(/\D/g, '')) || 10;
      const difficultyNormalization = 1 + (classModifier / 20);
      const score = willBeCorrect ? Math.round((70 + (30 * (1 - (simTime / 15000)))) * difficultyNormalization) : 0;
      
      await updateDoc(doc(db, 'liveQuizRooms', roomId, 'players', p.id), {
        hasAnswered: false,
        answerTimeMs: 0,
        score: increment(score)
      });
    } else {
      await updateDoc(doc(db, 'liveQuizRooms', roomId, 'players', p.id), {
        hasAnswered: false,
        answerTimeMs: 0
      });
    }
  }

  await updateDoc(roomRef, {
    currentQuestionIndex: nextIndex,
    questionStartTime: serverTimestamp()
  });
};

/**
 * LISTENERS
 */
export const listenToRoom = (roomId: string, callback: (room: any) => void) => {
  return onSnapshot(doc(db, 'liveQuizRooms', roomId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

export const listenToPlayers = (roomId: string, callback: (players: any[]) => void) => {
  const q = query(collection(db, 'liveQuizRooms', roomId, 'players'), orderBy('score', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
};

export const getQuestion = async (roomId: string, index: number): Promise<LiveQuizQuestion | null> => {
  const qSnap = await getDoc(doc(db, 'liveQuizRooms', roomId, 'questions', index.toString()));
  return qSnap.exists() ? qSnap.data() as LiveQuizQuestion : null;
};

export const getAllQuestions = async (roomId: string): Promise<LiveQuizQuestion[]> => {
  const snap = await getDocs(collection(db, 'liveQuizRooms', roomId, 'questions'));
  return snap.docs.map(d => d.data() as LiveQuizQuestion).sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
};
