
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
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { LiveQuizRoom, LiveQuizPlayer, LiveQuizQuestion } from '../types';

/**
 * UTILS
 */
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * ROOM MANAGEMENT
 */
export const createLiveQuizRoom = async (hostName: string, title: string, subject: string, questions: LiveQuizQuestion[]): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required.");

  const roomCode = generateRoomCode();
  const roomRef = doc(collection(db, 'liveQuizRooms'));
  const roomId = roomRef.id;

  const roomData: Partial<LiveQuizRoom> = {
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

  // Add questions to subcollection
  for (let i = 0; i < questions.length; i++) {
    await setDoc(doc(db, 'liveQuizRooms', roomId, 'questions', i.toString()), questions[i]);
  }

  // Join as host
  await joinLiveQuizRoom(roomId, hostName);

  return roomId;
};

export const findRoomByCode = async (code: string): Promise<string | null> => {
  const q = query(collection(db, 'liveQuizRooms'), where('roomCode', '==', code.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  if (data.status === 'finished') return null;
  return snap.docs[0].id;
};

export const joinLiveQuizRoom = async (roomId: string, playerName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required.");

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  const playerData: LiveQuizPlayer = {
    uid: user.uid,
    name: playerName,
    score: 0,
    hasAnswered: false,
    answerTimeMs: 0,
    isConnected: true,
    joinedAt: serverTimestamp()
  };

  await setDoc(playerRef, playerData);
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

export const submitLiveAnswer = async (roomId: string, questionIndex: number, isCorrect: boolean, startTime: number) => {
  const user = auth.currentUser;
  if (!user) return;

  const answerTimeMs = Date.now() - startTime;
  const basePoints = 1000;
  // Speed Bonus Logic: Linear decay over 15s
  const speedBonus = Math.max(0, Math.floor(1000 * (1 - (answerTimeMs / 15000))));
  const totalPoints = isCorrect ? (basePoints + speedBonus) : 0;

  const playerRef = doc(db, 'liveQuizRooms', roomId, 'players', user.uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) return;

  const currentScore = playerSnap.data().score || 0;

  await updateDoc(playerRef, {
    hasAnswered: true,
    answerTimeMs: answerTimeMs,
    score: currentScore + totalPoints
  });
};

export const nextLiveQuestion = async (roomId: string, nextIndex: number, totalQuestions: number) => {
  const roomRef = doc(db, 'liveQuizRooms', roomId);
  
  if (nextIndex >= totalQuestions) {
    await updateDoc(roomRef, { status: 'finished' });
    return;
  }

  // Reset participant state for next round
  const playersSnap = await getDocs(collection(db, 'liveQuizRooms', roomId, 'players'));
  for (const p of playersSnap.docs) {
    await updateDoc(doc(db, 'liveQuizRooms', roomId, 'players', p.id), {
      hasAnswered: false,
      answerTimeMs: 0
    });
  }

  await updateDoc(roomRef, {
    currentQuestionIndex: nextIndex,
    questionStartTime: serverTimestamp()
  });
};

/**
 * LISTENERS
 */
export const listenToRoom = (roomId: string, callback: (room: LiveQuizRoom) => void) => {
  return onSnapshot(doc(db, 'liveQuizRooms', roomId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as LiveQuizRoom);
    }
  });
};

export const listenToPlayers = (roomId: string, callback: (players: LiveQuizPlayer[]) => void) => {
  const q = query(collection(db, 'liveQuizRooms', roomId, 'players'), orderBy('score', 'desc'));
  return onSnapshot(q, (snap) => {
    const players = snap.docs.map(d => d.data() as LiveQuizPlayer);
    callback(players);
  });
};

export const getQuestion = async (roomId: string, index: number): Promise<LiveQuizQuestion | null> => {
  const qSnap = await getDoc(doc(db, 'liveQuizRooms', roomId, 'questions', index.toString()));
  if (!qSnap.exists()) return null;
  return qSnap.data() as LiveQuizQuestion;
};

export const getAllQuestions = async (roomId: string): Promise<LiveQuizQuestion[]> => {
  const snap = await getDocs(collection(db, 'liveQuizRooms', roomId, 'questions'));
  return snap.docs.map(d => d.data() as LiveQuizQuestion);
};
