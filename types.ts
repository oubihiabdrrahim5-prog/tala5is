
export type ImportanceLevel = 'High' | 'Medium' | 'Low';

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Resource {
  title: string;
  uri: string;
}

export interface LessonParagraph {
  content: string;
  importance: ImportanceLevel;
  importanceLabel: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SummarizationResult {
  id: string;
  title: string;
  subject: string;
  summary: string;
  keyTerms: KeyTerm[];
  paragraphs: LessonParagraph[];
  quiz: QuizQuestion[];
  relatedResources: Resource[];
  overallLevel: string;
  createdAt: string;
}

export type InputMode = 'text' | 'image' | 'pdf';
export type ViewState = 'landing' | 'auth' | 'app' | 'dashboard' | 'library';
export type AuthMode = 'login' | 'signup';

export interface User {
  name: string;
  email: string;
  role?: 'admin' | 'user';
  createdAt?: string;
}

export interface FeedbackEntry {
  id: string;
  userName: string;
  userEmail: string;
  content: string;
  date: string;
  status: 'new' | 'read' | 'archived';
}

export interface AppMessage {
  id: string;
  from: string;
  to: string; // email or 'all'
  content: string;
  date: string;
  type: 'private' | 'broadcast';
}

export interface AppState {
  isProcessing: boolean;
  result: SummarizationResult | null;
  error: string | null;
  user: User | null;
  view: ViewState;
  authMode: AuthMode;
}
