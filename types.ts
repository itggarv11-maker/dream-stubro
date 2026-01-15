
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

export type AssessmentMode = 'speak' | 'type' | 'upload';

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
  jobOccupations: { title: string; scope: string; salaryRange: string }[];
}

export interface RevisionCurriculum {
  diagnosis: string;
  weakNodes: string[];
  sevenDayPlan: { day: number; topic: string; tool: string; goal: string }[];
  guaranteedMarksTarget: string;
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

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

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

export interface PlayerPosition {
  x: number;
  y: number;
}

export interface Interaction {
  id: number;
  position: PlayerPosition;
  prompt: string;
  correct_answer: string;
  success_message: string;
  failure_message: string;
}

export interface GameLevel {
  title: string;
  goal: string;
  player_start: PlayerPosition;
  grid: { type: 'floor' | 'wall' | 'exit' }[][];
  interactions: Interaction[];
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
