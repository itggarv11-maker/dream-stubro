
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
  addAi: boolean = true
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized access node.");

  const roomCode = generateRoomCode();
  const roomRef = doc(collection(db, 'liveQuizRooms'));
  const roomId = roomRef.id;

  const roomData: any = {
    roomCode,
    hostUid: user.uid,
    status: 'lobby',
    currentQuestionIndex: 0,
    questionStartTime: null,
    title,
    subject,
    createdAt: serverTimestamp()
  };

  await setDoc(roomRef, roomData);

  // Synchronized Question Storage
  const batch = questions.map((q, i) => {
      return setDoc(doc(db, 'liveQuizRooms', roomId, 'questions', i.toString()), { 
          questionText: q.questionText || (q as any).question || "Undefined Logic Node",
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          explanation: q.explanation || "System logic verified.",
          index: i 
      });
  });
  await Promise.all(batch);

  await joinLiveQuizRoom(roomId, hostName);
  
  if (addAi) {
    await addAiBot(roomId, "ZENITH_BOT_ALPHA");
    await addAiBot(roomId, "OMEGA_SYNTH_X");
  }

  return roomId;
};

const addAiBot = async (roomId: string, name: string) => {
  const botUid = `ai_bot_${Math.random().toString(36).substr(2, 5)}`;
  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', botUid);
  await setDoc(playerRef, {
    uid: botUid,
    name: name,
    score: 0,
    streak: 0,
    isAi: true,
    hasAnswered: false,
    answerTimeMs: 0,
    joinedAt: serverTimestamp()
  });
};

export const findRoomByCode = async (code: string): Promise<string | null> => {
  if (!code) return null;
  const q = query(collection(db, 'liveQuizRooms'), where('roomCode', '==', code.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
};

export const joinLiveQuizRoom = async (roomId: string, playerName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication node offline.");

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  await setDoc(playerRef, {
    uid: user.uid,
    name: playerName.toUpperCase(),
    score: 0,
    streak: 0,
    hasAnswered: false,
    answerTimeMs: 0,
    isConnected: true,
    isAi: false,
    joinedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * GAME ACTIONS
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

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) return;

  const data = playerSnap.data();
  const currentScore = data.score || 0;
  const currentStreak = data.streak || 0;

  const answerTimeMs = Date.now() - startTime;
  const basePoints = 1000;
  const speedBonus = Math.max(0, 500 * (1 - (answerTimeMs / 15000)));
  const rawRoundScore = isCorrect ? Math.round(basePoints + speedBonus) : 0;

  await updateDoc(playerRef, {
    hasAnswered: true,
    answerTimeMs: answerTimeMs,
    score: currentScore + rawRoundScore,
    streak: isCorrect ? currentStreak + 1 : 0
  });

  return { earnedPoints: rawRoundScore, isCorrect, streak: isCorrect ? currentStreak + 1 : 0 };
};

export const nextLiveQuestion = async (roomId: string, nextIndex: number, totalQuestions: number) => {
  const roomRef = doc(db, 'liveQuizRooms', roomId);
  if (nextIndex >= totalQuestions) {
    await updateDoc(roomRef, { status: 'finished' });
    return;
  }

  const playersRef = collection(db, 'liveQuizRooms', roomId, 'players');
  const playersSnap = await getDocs(playersRef);
  
  const updates = playersSnap.docs.map(p => {
    const pData = p.data();
    const pRef = doc(db, 'liveQuizRooms', roomId, 'players', p.id);
    if (pData.isAi) {
        const correct = Math.random() > 0.4;
        const pts = correct ? Math.round(1000 + (Math.random() * 400)) : 0;
        return updateDoc(pRef, { hasAnswered: false, score: increment(pts) });
    }
    return updateDoc(pRef, { hasAnswered: false });
  });

  await Promise.all(updates);
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

export const getQuestion = async (roomId: string, index: number): Promise<any | null> => {
  const qSnap = await getDoc(doc(db, 'liveQuizRooms', roomId, 'questions', index.toString()));
  return qSnap.exists() ? qSnap.data() : null;
};

export const getAllQuestions = async (roomId: string): Promise<any[]> => {
  const snap = await getDocs(collection(db, 'liveQuizRooms', roomId, 'questions'));
  return snap.docs.map(d => d.data()).sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
};
