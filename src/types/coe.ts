/**
 * coe.ts
 * Specialized Document Processing & RAG Pipeline Type Definitions
 * for KLE Technological University Online Examination System Agent
 */

export type DocumentProcessingStatus = 'Processing' | 'Pending Verification' | 'Completed' | 'Failed';

export interface GroundingSourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface QaProposalItem {
  id: string;
  docId: string;
  questionNumber: number;
  question: string;
  type: 'mcq' | 'subjective' | 'interview_problem';
  options?: string[]; // 4 plausible distractors for MCQs
  correctAnswer: string;
  rubricOrRationale: string;
  bloomLevel: 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';
  marks: number;
  sourceChunkIds: string[];
  searchGroundingSources?: GroundingSourceCitation[];
  searchContextBenchmark?: string;
  status: 'draft' | 'approved' | 'rejected' | 'edited';
  coeEditNote?: string;
  updatedAt?: string;
}

export interface DocumentChunkRecord {
  id: string;
  docId: string;
  chunkIndex: number;
  text: string;
  pageNumber: number;
  tokensApprox: number;
  sectionTitle?: string;
  vectorDimension?: number;
  embeddingVector?: number[]; // 768-dim float embedding for native Firestore FieldValue.vector()
}

export interface CoeDocument {
  id: string;
  filename: string;
  courseCode: string;
  title: string;
  status: DocumentProcessingStatus;
  uploadedAt: string;
  uploadedBy: string;
  pageCount: number;
  wordCount: number;
  chunkCount: number;
  rawPdfUrl?: string;
  rawPdfBase64?: string;
  finalPdfUrl?: string;
  finalPdfBase64?: string;
  appendedPagesCount?: number;
  coeApprovedBy?: string;
  coeApprovedAt?: string;
  coeNotes?: string;
  auditTrail: Array<{
    action: string;
    timestamp: string;
    actor: string;
    details: string;
  }>;
}
