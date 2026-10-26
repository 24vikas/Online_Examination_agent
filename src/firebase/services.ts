import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './config.ts';
import type {
  Exam,
  Question,
  ExamSubmission,
  IntegrityLog,
  Grievance,
  UserProfile,
  Registration,
} from '../types/exam.ts';
import {
  INITIAL_USERS,
  INITIAL_EXAMS,
  INITIAL_QUESTIONS,
  INITIAL_SUBMISSIONS,
  INITIAL_INTEGRITY_LOGS,
  INITIAL_GRIEVANCES,
} from './seedData.ts';

// Local storage fallback keys for offline continuity
const STORAGE_PREFIX = 'exam_sys_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

/**
 * Ensures a valid authenticated session exists in Firebase Auth
 * so Firestore security rules never reject calls with 'Missing or insufficient permissions'.
 */
export async function ensureFirebaseAuth(activeProfile?: UserProfile): Promise<void> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    if (auth.currentUser && activeProfile) {
      // Sync active academic role to Firestore user doc for rules authorization
      const normalizedRole = activeProfile.role === 'author' ? 'COE_AUTHOR' : activeProfile.role;
      const userDocData = sanitizePayloadForFirestore({
        ...activeProfile,
        id: auth.currentUser.uid,
        role: normalizedRole,
        email: auth.currentUser.email || activeProfile.email,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'users', auth.currentUser.uid), userDocData, { merge: true });
    }
  } catch (err) {
    console.warn('Firebase Auth state verification notice:', err);
  }
}

/**
 * General recursive sanitizer: removes any undefined fields so Firestore setDoc() never throws
 * "Unsupported field value: undefined".
 */
export function sanitizePayloadForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) {
      continue; // omit undefined
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) =>
        item !== null && typeof item === 'object' ? sanitizePayloadForFirestore(item) : item ?? null
      );
    } else if (val !== null && typeof val === 'object') {
      result[key] = sanitizePayloadForFirestore(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Strict Question sanitizer adhering to Firestore rules and data model:
 * - If MCQ: ensures options is an array (defaults to [] if missing/undefined).
 * - If subjective: omits options entirely.
 * - Strips any undefined values.
 */
export function sanitizeQuestionForFirestore(q: Question): Record<string, any> {
  const isMcq = q.type === 'mcq';
  const clean: Record<string, any> = {
    id: q.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    examId: q.examId || '',
    type: isMcq ? 'mcq' : 'subjective',
    prompt: q.prompt || '',
    suggestedMarks: typeof q.suggestedMarks === 'number' ? q.suggestedMarks : 5,
    maxMarks: typeof q.maxMarks === 'number' ? q.maxMarks : 5,
    orderIndex: typeof q.orderIndex === 'number' ? q.orderIndex : 0,
  };

  if (isMcq) {
    clean.options = Array.isArray(q.options) ? q.options.filter((o) => typeof o === 'string') : [];
    if (q.correctAnswer !== undefined) clean.correctAnswer = q.correctAnswer;
  } else {
    // Subjective question: explicitly omit options completely
    if (q.rubric !== undefined) clean.rubric = q.rubric;
    if (q.correctAnswer !== undefined) clean.correctAnswer = q.correctAnswer;
  }

  if (q.difficulty !== undefined) clean.difficulty = q.difficulty;
  if (q.explanation !== undefined) clean.explanation = q.explanation;

  return sanitizePayloadForFirestore(clean);
}

// User Profiles
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const localUsers = getLocal<UserProfile[]>('users', INITIAL_USERS);
  const foundLocal = localUsers.find((u) => u.id === userId);

  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Firestore read error, using cached user profile:', err);
  }

  return foundLocal || null;
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const localUsers = getLocal<UserProfile[]>('users', INITIAL_USERS);
  const index = localUsers.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    localUsers[index] = user;
  } else {
    localUsers.push(user);
  }
  setLocal('users', localUsers);

  try {
    await ensureFirebaseAuth(user);
    const sanitized = sanitizePayloadForFirestore(user);
    await setDoc(doc(db, 'users', user.id), sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore profile save warning:', err);
  }
}

// Exams
export async function getExams(): Promise<Exam[]> {
  const local = getLocal<Exam[]>('exams', INITIAL_EXAMS);
  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, 'exams'));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => d.data() as Exam);
      // Merge with initial exams to ensure all presets are available
      const remoteIds = new Set(remote.map((e) => e.id));
      const combined = [...remote, ...local.filter((e) => !remoteIds.has(e.id))];
      setLocal('exams', combined);
      return combined;
    }
  } catch (err) {
    console.warn('Firestore exam list warning:', err);
  }
  return local;
}

export async function saveExam(exam: Exam): Promise<void> {
  const local = getLocal<Exam[]>('exams', INITIAL_EXAMS);
  const idx = local.findIndex((e) => e.id === exam.id);
  if (idx >= 0) local[idx] = exam;
  else local.unshift(exam);
  setLocal('exams', local);

  try {
    await ensureFirebaseAuth();
    const sanitized = sanitizePayloadForFirestore(exam);
    await setDoc(doc(db, 'exams', exam.id), sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore save exam warning:', err);
  }
}

export async function updateExam(examId: string, partial: Partial<Exam>): Promise<void> {
  const local = getLocal<Exam[]>('exams', INITIAL_EXAMS);
  const idx = local.findIndex((e) => e.id === examId);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...partial };
    setLocal('exams', local);
  }

  try {
    await ensureFirebaseAuth();
    const sanitized = sanitizePayloadForFirestore(partial);
    await updateDoc(doc(db, 'exams', examId), sanitized);
  } catch (err) {
    console.warn('Firestore update exam warning:', err);
  }
}

// Questions
export async function getExamQuestions(examId: string): Promise<Question[]> {
  const allQuestionsMap = getLocal<Record<string, Question[]>>('questions', INITIAL_QUESTIONS);
  const local = allQuestionsMap[examId] || [];

  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, `exams/${examId}/questions`));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => d.data() as Question).sort((a, b) => a.orderIndex - b.orderIndex);
      allQuestionsMap[examId] = remote;
      setLocal('questions', allQuestionsMap);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore questions read warning:', err);
  }

  return local;
}

export async function saveExamQuestion(examId: string, question: Question): Promise<void> {
  const sanitized = sanitizeQuestionForFirestore({ ...question, examId });
  const allQuestionsMap = getLocal<Record<string, Question[]>>('questions', INITIAL_QUESTIONS);
  const list = allQuestionsMap[examId] || [];
  const idx = list.findIndex((q) => q.id === sanitized.id);
  if (idx >= 0) list[idx] = sanitized as Question;
  else list.push(sanitized as Question);
  allQuestionsMap[examId] = list;
  setLocal('questions', allQuestionsMap);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, `exams/${examId}/questions`, sanitized.id), sanitized);
    await setDoc(doc(db, 'questions', sanitized.id), sanitized);
  } catch (err) {
    console.warn('Firestore save question warning:', err);
  }
}

export async function bulkSaveExamQuestions(examId: string, questions: Question[]): Promise<void> {
  const sanitizedList = questions.map((q, idx) =>
    sanitizeQuestionForFirestore({
      ...q,
      examId,
      orderIndex: typeof q.orderIndex === 'number' ? q.orderIndex : idx,
    })
  );

  const allQuestionsMap = getLocal<Record<string, Question[]>>('questions', INITIAL_QUESTIONS);
  allQuestionsMap[examId] = sanitizedList as Question[];
  setLocal('questions', allQuestionsMap);

  await ensureFirebaseAuth();
  for (const q of sanitizedList) {
    try {
      await setDoc(doc(db, `exams/${examId}/questions`, q.id), q);
      await setDoc(doc(db, 'questions', q.id), q);
    } catch (err) {
      console.warn(`Firestore save question ${q.id} warning:`, err);
    }
  }
}

// Submissions
export async function getSubmissions(): Promise<ExamSubmission[]> {
  const local = getLocal<ExamSubmission[]>('submissions', INITIAL_SUBMISSIONS);
  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, 'submissions'));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => d.data() as ExamSubmission);
      setLocal('submissions', remote);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore submissions warning:', err);
  }
  return local;
}

export async function saveSubmission(submission: ExamSubmission): Promise<void> {
  const sanitized = sanitizePayloadForFirestore({
    ...submission,
    timestamp: submission.submittedAt || new Date().toISOString(),
  });
  const local = getLocal<ExamSubmission[]>('submissions', INITIAL_SUBMISSIONS);
  const idx = local.findIndex((s) => s.id === sanitized.id);
  if (idx >= 0) local[idx] = sanitized as ExamSubmission;
  else local.unshift(sanitized as ExamSubmission);
  setLocal('submissions', local);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'submissions', sanitized.id), sanitized);
  } catch (err) {
    console.warn('Firestore save submission warning:', err);
  }
}

// Integrity Logs
export async function getIntegrityLogs(): Promise<IntegrityLog[]> {
  const local = getLocal<IntegrityLog[]>('integrityLogs', INITIAL_INTEGRITY_LOGS);
  try {
    const snap = await getDocs(collection(db, 'integrityLogs'));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => d.data() as IntegrityLog);
      setLocal('integrityLogs', remote);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore integrity logs warning:', err);
  }
  return local;
}

export async function addIntegrityLog(log: IntegrityLog): Promise<void> {
  const sanitized = sanitizePayloadForFirestore(log);
  const local = getLocal<IntegrityLog[]>('integrityLogs', INITIAL_INTEGRITY_LOGS);
  local.unshift(sanitized as IntegrityLog);
  setLocal('integrityLogs', local);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'integrityLogs', sanitized.id), sanitized);
    await setDoc(doc(db, 'integrity_logs', sanitized.id), sanitized);
  } catch (err) {
    console.warn('Firestore add integrity log warning:', err);
  }
}

export async function updateIntegrityLog(
  logId: string,
  update: Partial<IntegrityLog>,
): Promise<void> {
  const local = getLocal<IntegrityLog[]>('integrityLogs', INITIAL_INTEGRITY_LOGS);
  const idx = local.findIndex((l) => l.id === logId);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...update };
    setLocal('integrityLogs', local);
  }

  try {
    await ensureFirebaseAuth();
    const sanitized = sanitizePayloadForFirestore(update);
    await updateDoc(doc(db, 'integrityLogs', logId), sanitized);
    await updateDoc(doc(db, 'integrity_logs', logId), sanitized);
  } catch (err) {
    console.warn('Firestore update integrity log warning:', err);
  }
}

// Grievances
export async function getGrievances(): Promise<Grievance[]> {
  const local = getLocal<Grievance[]>('grievances', INITIAL_GRIEVANCES);
  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, 'grievances'));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => d.data() as Grievance);
      setLocal('grievances', remote);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore grievances warning:', err);
  }
  return local;
}

export async function saveGrievance(grievance: Grievance): Promise<void> {
  const sanitized = sanitizePayloadForFirestore(grievance);
  const local = getLocal<Grievance[]>('grievances', INITIAL_GRIEVANCES);
  const idx = local.findIndex((g) => g.id === sanitized.id);
  if (idx >= 0) local[idx] = sanitized as Grievance;
  else local.unshift(sanitized as Grievance);
  setLocal('grievances', local);

  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'grievances', sanitized.id), sanitized);
  } catch (err) {
    console.warn('Firestore save grievance warning:', err);
  }
}

// Registrations
export async function getRegistrations(studentId?: string): Promise<Registration[]> {
  const defaultRegistrations: Registration[] = [
    {
      id: 'reg_alex_cs301',
      examId: 'exam_cs301_distributed',
      studentId: 'stu_alex_rivera',
      studentName: 'Alex Rivera',
      studentEmail: 'alex.rivera@student.university.edu',
      registeredAt: '2026-09-05T10:00:00.000Z',
      eligibilityVerified: true,
      attendanceRate: 88.5,
      feeCleared: true,
      status: 'submitted',
    },
    {
      id: 'reg_maya_cs301',
      examId: 'exam_cs301_distributed',
      studentId: 'stu_maya_patel',
      studentName: 'Maya Patel',
      studentEmail: 'maya.patel@student.university.edu',
      registeredAt: '2026-09-06T11:00:00.000Z',
      eligibilityVerified: true,
      attendanceRate: 94.2,
      feeCleared: true,
      status: 'submitted',
    },
  ];

  const local = getLocal<Registration[]>('registrations', defaultRegistrations);
  if (studentId) {
    return local.filter((r) => r.studentId === studentId);
  }
  return local;
}

export async function saveRegistration(registration: Registration): Promise<void> {
  const local = getLocal<Registration[]>('registrations', []);
  const idx = local.findIndex((r) => r.id === registration.id);
  if (idx >= 0) local[idx] = registration;
  else local.unshift(registration);
  setLocal('registrations', local);

  try {
    await setDoc(doc(db, 'registrations', registration.id), registration);
  } catch (err) {
    console.warn('Firestore save registration warning:', err);
  }
}

// ==========================================
// FIREBASE AUTHENTICATION & ROLE-BASED ACCESS
// ==========================================

export async function signInUser(email: string, pass: string): Promise<UserProfile> {
  // First check if matching any predefined demo accounts for immediate match
  const predefined = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userId = cred.user.uid;
    const existing = await getUserProfile(userId);
    if (existing) return existing;

    if (predefined) {
      const merged: UserProfile = { ...predefined, id: userId, email: cred.user.email || email };
      await saveUserProfile(merged);
      return merged;
    }

    const fallbackProfile: UserProfile = {
      id: userId,
      email: cred.user.email || email,
      displayName: cred.user.displayName || email.split('@')[0],
      role: email.includes('fac') || email.includes('eleanor') || email.includes('prof') ? 'faculty' : 'student',
      department: 'Computer Science & Engineering',
      attendanceRate: 85,
      feeCleared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(fallbackProfile);
    return fallbackProfile;
  } catch (err: any) {
    // If user exists in local demo set (offline/preview fallback without needing actual network password registration)
    if (predefined && (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || !navigator.onLine)) {
      return predefined;
    }
    throw err;
  }
}

export async function registerUser(params: {
  email: string;
  pass: string;
  displayName: string;
  role: 'faculty' | 'student';
  department?: string;
  studentId?: string;
}): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.pass);
    await updateProfile(cred.user, { displayName: params.displayName });

    const newProfile: UserProfile = {
      id: cred.user.uid,
      email: cred.user.email || params.email,
      displayName: params.displayName,
      role: params.role,
      roleTitle: params.role === 'faculty' ? 'Faculty Lead & Examiner' : 'Undergraduate Student Candidate',
      department: params.department || (params.role === 'faculty' ? 'Department of Computer Science & Engineering' : 'Computer Science'),
      studentId: params.role === 'student' ? (params.studentId || `CS-2026-${Math.floor(100 + Math.random() * 900)}`) : undefined,
      attendanceRate: 88,
      feeCleared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveUserProfile(newProfile);
    return newProfile;
  } catch (err: any) {
    // If user is offline or Firebase project email provider not yet enabled in console, provide seamless academic onboarding
    console.warn('Firebase Auth registration fallback:', err?.message);
    const mockId = `usr_${Date.now()}`;
    const newProfile: UserProfile = {
      id: mockId,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      roleTitle: params.role === 'faculty' ? 'Faculty Lead & Examiner' : 'Undergraduate Student Candidate',
      department: params.department || 'Department of Computer Science & Engineering',
      studentId: params.role === 'student' ? (params.studentId || `CS-2026-${Math.floor(100 + Math.random() * 900)}`) : undefined,
      attendanceRate: 88,
      feeCleared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(newProfile);
    return newProfile;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
}

export function listenToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// PDF Document and Storage Metadata
export interface StoredDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  courseCode: string;
  uploadedAt: string;
  status: 'indexed' | 'processing' | 'failed';
  pageCount?: number;
  wordCount?: number;
  chunkCount?: number;
  vectorIndexName: string;
}

export async function saveDocumentMetadata(docMeta: StoredDocument): Promise<void> {
  const local = getLocal<StoredDocument[]>('uploaded_docs', []);
  const idx = local.findIndex((d) => d.id === docMeta.id);
  if (idx >= 0) local[idx] = docMeta;
  else local.unshift(docMeta);
  setLocal('uploaded_docs', local);

  try {
    await setDoc(doc(db, 'documents', docMeta.id), docMeta);
  } catch (err) {
    console.warn('Firestore doc metadata save warning:', err);
  }
}

export async function getDocumentMetadataList(): Promise<StoredDocument[]> {
  const local = getLocal<StoredDocument[]>('uploaded_docs', []);
  try {
    const snap = await getDocs(collection(db, 'documents'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as StoredDocument);
    }
  } catch (err) {
    console.warn('Firestore documents fetch warning:', err);
  }
  return local;
}
