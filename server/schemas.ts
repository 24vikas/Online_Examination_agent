/**
 * server/schemas.ts
 * Strict Zod input validation schemas for all examination system API endpoints.
 */

import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  topic: z.string().min(1).max(256).optional(),
  unit: z.number().int().min(1).max(10).optional(),
  bloomLevel: z.enum(['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']).optional(),
  count: z.number().int().min(1).max(20).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  courseCode: z.string().min(2).max(32).optional(),
});

export const gradeSubjectiveSchema = z.object({
  questionPrompt: z.string().min(3).max(4000),
  studentAnswer: z.string().min(1).max(10000),
  maxMarks: z.number().min(1).max(100),
  rubric: z.string().max(4000).optional(),
  valuationSchemePoints: z.array(z.string()).optional(),
});

export const academicChatSchema = z.object({
  message: z.string().min(1).max(4000),
  courseCode: z.string().max(32).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'assistant']),
    content: z.string().max(4000),
  })).optional(),
});

export const analyzeIntegritySchema = z.object({
  events: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    details: z.any().optional(),
  })).min(1),
  examId: z.string().min(1).max(64),
  studentUid: z.string().min(1).max(64),
});

export const ragIndexSchema = z.object({
  courseCode: z.string().min(2).max(32),
  title: z.string().min(2).max(256),
  content: z.string().min(10).max(500000),
});

export const ragQuerySchema = z.object({
  courseCode: z.string().min(2).max(32),
  query: z.string().min(2).max(1000),
  topK: z.number().int().min(1).max(10).optional(),
});

export const extractPdfSchema = z.object({
  pdfBase64: z.string().min(10),
  courseCode: z.string().max(32).optional(),
  title: z.string().max(256).optional(),
});

export const coeUploadSchema = z.object({
  filename: z.string().min(1).max(256).optional(),
  courseCode: z.string().min(2).max(32).optional(),
  title: z.string().min(2).max(256).optional(),
  pdfBase64: z.string().optional(),
  uploadedBy: z.string().max(128).optional(),
});

export const coeApproveAppendSchema = z.object({
  docId: z.string().min(1).max(128),
  approvedQaIds: z.array(z.string()).optional(),
  editedQaItems: z.array(z.any()).optional(),
  coeUser: z.object({
    id: z.string(),
    displayName: z.string(),
    role: z.string(),
  }).optional(),
  coeNotes: z.string().max(2000).optional(),
});

export const auraDispatchSchema = z.object({
  functionName: z.enum([
    'verify_eligibility',
    'manage_session',
    'monitor_integrity',
    'grade_objective',
    'draft_subjective_grade',
    'poll_faculty_approval',
    'publish_results_and_archive',
    'manage_grievance',
  ]),
  args: z.record(z.string(), z.any()),
  telemetry: z.record(z.string(), z.any()).optional(),
});
