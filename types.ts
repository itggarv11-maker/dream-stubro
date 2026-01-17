
import type { User } from 'firebase/auth';

export type FirebaseUser = User;

export enum Subject {
  Math = "Math",
  Physics = "Physics",
  Chemistry = "Chemistry",
  Biology = "Biology",
  Science = "Science (General)",
  History = "History",
  Geography = "Geography",
  SST = "Social Studies (SST)",
  English = "English",
  ComputerScience = "Computer Science"
}

export type ClassLevel = 
  | "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10" 
  | "Class 11" | "Class 12" | "Any";

/**
 * Fixed: Added missing QuizDifficulty to resolve import error in AppPage.tsx
 */
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Fixed: Added missing AssessmentMode to resolve import error in QuizComponent.tsx
 */
export type AssessmentMode = 'type' | 'speak' | 'upload';

export interface GameMission {
    id: string;
    type: 'unlock' | 'apply' | 'repair' | 'boss';
    title: string;
    objective: string;
    concept: string;
    challenge: {
        prompt: string;
        options?: string[];
        correctAnswer: string;
        logicHint: string;
    };
    rewardPower?: string;
}

export interface GameNPC {
    id: string;
    name: string;
    role: string;
    dialogue: string[];
    position: [number, number, number];
}

export interface GameverseWorld {
    id: string;
    title: string;
    theme: 'neon_city' | 'quantum_lab' | 'ancient_archive';
    missions: GameMission[];
    npcs: GameNPC[];
    globalAbilities: string[];
}

export interface DiagramSpec {
  type: 'geometry' | 'graph' | 'shape' | 'circle' | 'triangle';
  width: number;
  height: number;
  points: Record<string, [number, number]>;
  lines: { from: string; to: string; label?: string; dashed?: boolean; isVector?: boolean }[];
  circles?: { center: string; radius: number; label?: string }[];
  angles?: { vertex: string; p1: string; p2: string; label?: string; isRightAngle?: boolean }[];
  labels: { pos: [number, number]; text: string; color?: string }[];
}

export interface MathsSolution {
  concept: string;
  formula: string;
  steps: { action: string; result: string; reason: string }[];
  diagram_spec?: DiagramSpec;
  finalAnswer: string;
  recap: string;
}

export interface QuizQuestion {
  question: string;
  type: 'mcq' | 'written';
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  diagram_spec?: DiagramSpec;
  userAnswer?: string | null;
  isCorrect?: boolean;
}

export interface SmartSummary {
  title: string;
  coreConcepts: { term: string; definition: string }[];
  visualAnalogy: { analogy: string; explanation: string };
  examSpotlight: string[];
  stuBroTip: string;
  diagram_spec?: DiagramSpec;
}

export interface MindMapNode {
  term: string;
  explanation: string;
  children?: MindMapNode[];
}

export interface WorkHistoryItem {
  id: string;
  type: string;
  title: string;
  date: string;
  data: any;
  subject?: string;
}

export type ChatMessage = {
  role: 'user' | 'model' | 'system';
  text: string;
};

export interface Flashcard {
  term: string;
  definition: string;
  tip?: string;
}

export interface QuestionPaper {
  title: string;
  totalMarks: number;
  instructions: string;
  questions: {
    question: string;
    marks: number;
    questionType: 'mcq' | 'written';
    options?: string[];
    answer: string;
  }[];
}

export interface GradedPaper {
  totalMarksAwarded: number;
  overallFeedback: string;
  gradedQuestions: {
    questionNumber: number;
    studentAnswerTranscription: string;
    marksAwarded: number;
    feedback: {
      whatWasCorrect: string;
      whatWasIncorrect: string;
      suggestionForImprovement: string;
    };
  }[];
}

export interface VivaQuestion {
  questionText: string;
  isAnswered: boolean;
  answerText?: string;
  answerAudioBlob?: Blob;
  answerPlaybackUrl?: string;
  marksAwarded?: number;
  feedback?: string;
  transcription?: string;
}

export interface VisualExplanationScene {
  imageUrl?: string;
  imageBytes?: string;
  narration: string;
}

export interface DebateTurn {
  speaker: 'user' | 'critico';
  text: string;
}

export interface DebateScorecard {
  overallScore: number;
  concludingRemarks: string;
  argumentStrength: number;
  rebuttalEffectiveness: number;
  clarity: number;
  strongestArgument: string;
  improvementSuggestion: string;
}

export type LiveQuizStatus = 'lobby' | 'live' | 'finished';

export interface LiveQuizRoom {
  id: string;
  roomCode: string;
  hostUid: string;
  status: LiveQuizStatus;
  currentQuestionIndex: number;
  questionStartTime: any;
  title: string;
  subject: string;
  createdAt: any;
}

export interface LiveQuizPlayer {
  uid: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  answerTimeMs: number;
  isConnected: boolean;
  joinedAt: any;
}

export interface LiveQuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface LabExperiment {
  experimentTitle: string;
  objective: string;
  hypothesis: string;
  materials: string[];
  safetyPrecautions: string[];
  procedure: string[];
}

export interface LiteraryAnalysis {
  title: string;
  author?: string;
  overallSummary: string;
  themes: string[];
  literaryDevices: { device: string; example: string }[];
  characterAnalysis: { character: string; analysis: string }[];
}

export interface Analogy {
  analogy: string;
  explanation: string;
}

export interface RealWorldApplication {
  industry: string;
  description: string;
}

export interface LearningPath {
  mainTopic: string;
  weakAreas: string[];
  learningSteps: {
    step: number;
    topic: string;
    goal: string;
    resources: string[];
  }[];
}

export interface CareerRoadmap {
  title: string;
  vision: string;
  financialMilestones: string[];
  classByClassRoadmap: {
    grade: string;
    focus: string[];
    exams: string[];
    coachingRecommendation: string;
  }[];
  jobOccupations: {
    title: string;
    scope: string;
    salaryRange: string;
  }[];
}
