import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Search,
  ExternalLink,
  BookOpen,
  Lock,
  AlertTriangle,
  Check,
  X,
  FileCheck,
  Copy,
  Clock,
  Sliders,
  ChevronRight,
  Calendar,
  Building2,
  User,
  Zap,
} from 'lucide-react';
import type { CoeDocument, DocumentChunkRecord, QaProposalItem } from '../../types/coe.ts';
import type { UserProfile } from '../../types/exam.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusChip } from '../ui/StatusChip.tsx';

interface CoeDocumentAgentStudioProps {
  currentUser: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
}

export const CoeDocumentAgentStudio: React.FC<CoeDocumentAgentStudioProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'verification' | 'vault'>('verification');

  // Documents and active selection
  const [documents, setDocuments] = useState<CoeDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_cs301_curriculum');
  const [activeDoc, setActiveDoc] = useState<CoeDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkRecord[]>([]);
  const [qaProposals, setQaProposals] = useState<QaProposalItem[]>([]);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFilename, setUploadFilename] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('CS-301');
  const [documentTitle, setDocumentTitle] = useState<string>('Distributed Systems & Cloud Computing Syllabus');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Verification & Edit Modal
  const [editingQaItem, setEditingQaItem] = useState<QaProposalItem | null>(null);
  const [isApproveAndAppendRunning, setIsApproveAndAppendRunning] = useState<boolean>(false);
  const [coeApprovalNote, setCoeApprovalNote] = useState<string>(
    'Formally verified against KLE Technological University ABET/UGC curriculum standards. Approved for official Examination Addendum.'
  );

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isCoe =
    currentUser.role === 'author' ||
    currentUser.role === 'coe' ||
    currentUser.displayName.toLowerCase().includes('controller') ||
    currentUser.displayName.toLowerCase().includes('marcus') ||
    currentUser.displayName.toLowerCase().includes('sterling');

  // Load all documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // When selectedDocId changes, load document details
  useEffect(() => {
    if (selectedDocId) {
      loadDocumentDetails(selectedDocId);
    }
  }, [selectedDocId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/coe/documents');
      const json = await res.json();
      if (json.success && json.data) {
        setDocuments(json.data);
        if (!selectedDocId && json.data.length > 0) {
          setSelectedDocId(json.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch documents:', err);
    }
  };

  const loadDocumentDetails = async (docId: string) => {
    try {
      const res = await fetch(`/api/coe/document?id=${encodeURIComponent(docId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveDoc(json.data.document);
        setChunks(json.data.chunks || []);
        setQaProposals(json.data.qaProposals || []);
        if (json.data.chunks && json.data.chunks.length > 0) {
          setHighlightedChunkId(json.data.chunks[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load document details:', err);
    }
  };

  // 1-Click Load Sample Curriculum PDF
  const handleLoadSamplePdf = async () => {
    try {
      const res = await fetch('/api/coe/sample-pdf');
      const json = await res.json();
      if (json.success && json.data) {
        setUploadFilename(json.data.filename);
        setCourseCode(json.data.courseCode);
        setDocumentTitle(json.data.title);
        showToast('Sample KLE Tech Curriculum PDF pre-loaded! Click "Process PDF Ingestion" below.');
      }
    } catch (err) {
      console.warn('Sample PDF load notice:', err);
    }
  };

  // Handle Drag & Drop
  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setUploadFile(file);
        setUploadFilename(file.name);
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        showToast(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB)`);
      } else {
        showToast('Please upload a valid PDF document.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadFilename(file.name);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  // Execute Ingestion Pipeline
  const handleStartIngestion = async () => {
    setIsProcessing(true);
    setProcessingStep(1);

    try {
      let base64Data = '';
      if (uploadFile) {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });
      }

      setProcessingStep(2); // Chunks & Vector embeddings
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(3); // Deep Search Grounding
      const res = await fetch('/api/coe/upload-and-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFilename || 'Curriculum-Syllabus.pdf',
          courseCode: courseCode || 'CS-301',
          title: documentTitle || 'Academic Syllabus Directive',
          pdfBase64: base64Data,
          uploadedBy: currentUser.displayName,
        }),
      });

      setProcessingStep(4); // Storing in Firestore & Pausing at Gate
      const json = await res.json();

      if (json.success && json.data) {
        showToast(`PDF processed! 5 chunks vectorized with FieldValue.vector(). Held at COE Verification Gate.`);
        await loadDocuments();
        setSelectedDocId(json.data.document.id);
        setActiveTab('verification');
      } else {
        throw new Error(json.error || 'Failed to process document');
      }
    } catch (err: any) {
      console.error('Ingestion error:', err);
      showToast(`Error: ${err.message || 'Failed to process PDF'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  // Toggle Approve/Reject on individual Q&A item
  const handleToggleApprove = (qaId: string) => {
    setQaProposals((prev) =>
      prev.map((item) =>
        item.id === qaId
          ? { ...item, status: item.status === 'approved' ? 'draft' : 'approved' }
          : item
      )
    );
  };

  const handleRejectQa = (qaId: string) => {
    setQaProposals((prev) =>
      prev.map((item) =>
        item.id === qaId ? { ...item, status: 'rejected' } : item
      )
    );
    showToast('Question proposal marked as rejected.');
  };

  const handleApproveAll = () => {
    setQaProposals((prev) =>
      prev.map((item) => (item.status !== 'rejected' ? { ...item, status: 'approved' } : item))
    );
    showToast('All valid Q&A items marked as Approved by COE.');
  };

  // Save edits from modal
  const handleSaveEdit = (edited: QaProposalItem) => {
    setQaProposals((prev) =>
      prev.map((item) => (item.id === edited.id ? { ...edited, status: 'approved' } : item))
    );
    setEditingQaItem(null);
    showToast(`Saved and approved Q${edited.questionNumber}!`);
  };

  // Execute PDF Appender System
  const handleExecutePdfAppend = async () => {
    if (!isCoe) {
      showToast('Permission Denied: Controller of Examinations (COE) role required to execute PDF Append.');
      return;
    }

    const approvedList = qaProposals.filter((item) => item.status === 'approved');
    if (approvedList.length === 0) {
      showToast('Please approve at least one Q&A pair before executing the PDF Appender.');
      return;
    }

    setIsApproveAndAppendRunning(true);
    try {
      const res = await fetch('/api/coe/approve-and-append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: selectedDocId,
          approvedQaIds: approvedList.map((q) => q.id),
          coeUser: {
            id: currentUser.id,
            displayName: currentUser.displayName,
            role: currentUser.role,
          },
          coeNotes: coeApprovalNote,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast('Success! Official COE Addendum generated and appended directly to the original PDF!');
        await loadDocuments();
        await loadDocumentDetails(selectedDocId);
        setActiveTab('vault');
      } else {
        throw new Error(json.error || 'Failed to append PDF');
      }
    } catch (err: any) {
      console.error('Appender error:', err);
      showToast(`Error: ${err.message || 'PDF Appender execution failed'}`);
    } finally {
      setIsApproveAndAppendRunning(false);
    }
  };

  // Download PDF Helper
  const handleDownloadPdf = (doc: CoeDocument) => {
    const pdfData = doc.finalPdfBase64 || doc.rawPdfBase64;
    if (!pdfData) {
      showToast('No PDF data available for download.');
      return;
    }
    const filename = doc.status === 'Completed'
      ? `${doc.courseCode}-Official-Appended-Examination-Addendum.pdf`
      : doc.filename;

    const link = document.createElement('a');
    link.href = pdfData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${filename}...`);
  };

  const handleOpenPdfPreview = (doc: CoeDocument) => {
    const pdfData = doc.finalPdfBase64 || doc.rawPdfBase64;
    if (!pdfData) {
      showToast('No PDF data available to preview.');
      return;
    }
    setPreviewPdfUrl(pdfData);
    setPreviewPdfTitle(`${doc.courseCode}: ${doc.title} (${doc.status === 'Completed' ? 'Appended Addendum' : 'Raw PDF'})`);
  };

  return (
    <div id="coe-document-agent-studio" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-xl px-4 py-3 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Academic Banner */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E8F0F8] text-[#0F4C81] border border-[#CBD5E1]">
              Office of the Controller of Examinations (COE)
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono uppercase bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              Native Vector RAG • PDF Appender
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[#0B2545] tracking-tight">
            Examination Document Processing & Automated PDF Appender Agent
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-3xl leading-relaxed">
            Ingest curriculum PDFs with native Firestore vector embeddings (<code className="text-[#0F4C81] font-mono text-xs">FieldValue.vector()</code>). Synthesize real-world Deep Search Q&A pairs, pause at the strict COE human-in-the-loop verification gate, and merge approved questions directly into the original PDF.
          </p>
        </div>

        {/* User Role Indicator & Guardrail Pill */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-xs space-y-2 shrink-0 min-w-[220px]">
          <div className="flex items-center justify-between">
            <span className="text-[#475569] text-xs">Active operator:</span>
            <StatusChip
              status={isCoe ? 'warning' : 'neutral'}
              label={isCoe ? 'COE ratification role' : currentUser.role.toUpperCase()}
            />
          </div>
          <p className="font-semibold text-[#0B2545] truncate">{currentUser.displayName}</p>
          {!isCoe && onSwitchUser && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => {
                onSwitchUser({
                  id: 'coe_marcus_sterling',
                  email: 'coe.sterling@university.edu',
                  displayName: 'Prof. Marcus Sterling',
                  role: 'author',
                  roleTitle: 'Controller of Examinations (COE)',
                  department: 'Office of the Controller of Examinations',
                  attendanceRate: 100,
                  feeCleared: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                showToast('Switched to Prof. Marcus Sterling (Controller of Examinations)');
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Switch to COE authority</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E2E8F0]">
        <button
          id="tab-btn-verification"
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'verification'
              ? 'border-[#0F4C81] text-[#0B2545] font-semibold'
              : 'border-transparent text-[#475569] hover:text-[#0B2545]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#0F4C81]" />
          <span>Verification queue (Split-Screen)</span>
          {documents.filter((d) => d.status === 'Pending Verification').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#FEF3C7] text-[#B45309] font-medium">
              {documents.filter((d) => d.status === 'Pending Verification').length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-upload"
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'border-[#0F4C81] text-[#0B2545] font-semibold'
              : 'border-transparent text-[#475569] hover:text-[#0B2545]'
          }`}
        >
          <Upload className="w-4 h-4 text-[#0F4C81]" />
          <span>Upload workspace (PDF Ingestion)</span>
        </button>

        <button
          id="tab-btn-vault"
          type="button"
          onClick={() => setActiveTab('vault')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'vault'
              ? 'border-[#0F4C81] text-[#0B2545] font-semibold'
              : 'border-transparent text-[#475569] hover:text-[#0B2545]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#0F4C81]" />
          <span>Document vault & downloads</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
            {documents.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VERIFICATION QUEUE (SPLIT-SCREEN DASHBOARD)                        */}
      {/* ========================================================================= */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {/* Document Selector and Action Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 shrink-0">Select Document:</label>
              <select
                id="select-coe-document"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-indigo-500 min-w-[280px]"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.courseCode}] {d.filename} ({d.status})
                  </option>
                ))}
              </select>

              {activeDoc && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    activeDoc.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : activeDoc.status === 'Pending Verification'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {activeDoc.status}
                </span>
              )}
            </div>

            {/* COE Gate Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApproveAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approve All Pairs</span>
              </button>

              <button
                id="btn-execute-pdf-append"
                type="button"
                disabled={isApproveAndAppendRunning || !isCoe}
                onClick={handleExecutePdfAppend}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                title={!isCoe ? 'COE role required to append PDF' : 'Appends approved Q&A pages directly to original PDF'}
              >
                {isApproveAndAppendRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Appending to PDF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Append Approved Q&A to PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Strict COE Role Verification Notice */}
          {!isCoe && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>COE Operational Guardrail Active:</strong> AI-generated Q&A pairs are held in draft state. Only the Controller of Examinations (COE) has authority to ratify and append pages to official PDFs.
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded uppercase">
                Read-Only Inspection Mode
              </span>
            </div>
          )}

          {/* Split-Screen Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ========================================================= */}
            {/* LEFT SCREEN: AI-Generated Q&A Pairs (Held at COE Gate)    */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[750px]">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-tight">AI-Generated Q&A Proposals</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {qaProposals.length} Items
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Held at COE Gate • Draft State
                </span>
              </div>

              {/* Proposals List */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {qaProposals.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">No Q&A proposals generated for this document yet.</p>
                  </div>
                ) : (
                  qaProposals.map((item) => {
                    const isApproved = item.status === 'approved';
                    const isRejected = item.status === 'rejected';

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.sourceChunkIds[0]) {
                            setHighlightedChunkId(item.sourceChunkIds[0]);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                          isApproved
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                            : isRejected
                            ? 'bg-rose-50/30 border-rose-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                        }`}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                              {item.questionNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              item.type === 'mcq'
                                ? 'bg-blue-100 text-blue-800'
                                : item.type === 'interview_problem'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {item.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.bloomLevel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              {item.marks} Marks
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                          {item.question}
                        </p>

                        {/* MCQ Options */}
                        {item.type === 'mcq' && item.options && item.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {item.options.map((opt, oIdx) => {
                              const isKey = opt === item.correctAnswer;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded text-[11px] font-medium border flex items-center gap-1.5 ${
                                    isKey
                                      ? 'bg-emerald-100/60 border-emerald-400 text-emerald-900 font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isKey && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Correct Key & Rubric Preview */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <strong className="text-emerald-700">Key / Answer:</strong>
                            <span className="truncate">{item.correctAnswer}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            <strong>Valuation Rubric:</strong> {item.rubricOrRationale}
                          </p>
                        </div>

                        {/* Deep Search Citation */}
                        {item.searchContextBenchmark && (
                          <div className="text-[10px] text-indigo-700 bg-indigo-50/60 p-1.5 rounded border border-indigo-100 flex items-center gap-1.5">
                            <Search className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">
                              <strong>Deep Search Grounding:</strong> {item.searchContextBenchmark}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons: Approve, Edit, Reject */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Source: {item.sourceChunkIds[0] || 'Curriculum Chunk'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingQaItem(item);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectQa(item.id);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3 h-3 text-rose-500" />
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleApprove(item.id);
                              }}
                              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs ${
                                isApproved
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isApproved ? 'Approved' : 'Approve'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SCREEN: Original PDF Source Chunks & Vector Store   */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[750px]">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-tight">Original PDF Chunks & Native Vectors</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    FieldValue.vector()
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {chunks.length} Chunks • 768 Dimensions
                </span>
              </div>

              {/* Chunks Feed */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {chunks.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <Database className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">No vector chunks indexed yet.</p>
                  </div>
                ) : (
                  chunks.map((chunk) => {
                    const isHighlighted = highlightedChunkId === chunk.id;

                    return (
                      <div
                        key={chunk.id}
                        id={`chunk-${chunk.id}`}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                          isHighlighted
                            ? 'bg-amber-50/50 border-amber-400 shadow-sm ring-1 ring-amber-400/40'
                            : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Chunk Meta Header */}
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                              Chunk #{chunk.chunkIndex + 1}
                            </span>
                            <span className="text-slate-600 font-semibold">
                              Page {chunk.pageNumber}
                            </span>
                            {chunk.sectionTitle && (
                              <span className="text-slate-500 text-[11px] italic">
                                • {chunk.sectionTitle}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                            <span>{chunk.tokensApprox} tokens</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              768-D Vector Stored
                            </span>
                          </div>
                        </div>

                        {/* Chunk Text Content */}
                        <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                          {chunk.text}
                        </p>

                        {/* Vector Representation Snippet */}
                        {chunk.embeddingVector && (
                          <div className="p-2 bg-slate-900 rounded font-mono text-[9px] text-slate-400 space-y-1">
                            <div className="flex items-center justify-between text-indigo-300 font-semibold">
                              <span>Firestore Native Vector Embedding:</span>
                              <span>FieldValue.vector([768])</span>
                            </div>
                            <div className="text-emerald-400 truncate">
                              [{chunk.embeddingVector.slice(0, 8).join(', ')} ... +760 more]
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UPLOAD WORKSPACE (PDF INGESTION & PIPELINE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Document Ingestion & Native Vector Pipeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload raw syllabus, curriculum, or exam blueprint PDFs. The backend extracts clean text, partitions into 800–1200 char chunks, and computes 768-dim embeddings stored directly in Firestore.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadSamplePdf}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Sample KLE Tech Curriculum PDF</span>
              </button>
            </div>

            {/* Document Metadata Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Course Code:
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS-301"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Document Title:
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Cloud Computing Syllabus"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropFile}
              className={`p-10 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="file-pdf-upload"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <label htmlFor="file-pdf-upload" className="cursor-pointer block space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {uploadFilename ? uploadFilename : 'Drag and drop syllabus or exam PDF here'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports high-resolution curriculum documents up to 10MB • PyMuPDF / pdf-parse
                  </p>
                </div>
                <span className="inline-block px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                  {uploadFilename ? 'Select Another File' : 'Browse Files'}
                </span>
              </label>
            </div>

            {/* Processing Steps Visualization */}
            {isProcessing && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-2 text-amber-300">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    Executing RAG Document Ingestion & Deep Search Synthesis
                  </span>
                  <span className="font-mono text-slate-400">Step {processingStep} of 4</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] text-center pt-1 font-medium">
                  <div className={`p-2 rounded ${processingStep >= 1 ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}>
                    1. PDF Text Extract
                  </div>
                  <div className={`p-2 rounded ${processingStep >= 2 ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}>
                    2. Recursive Chunker
                  </div>
                  <div className={`p-2 rounded ${processingStep >= 3 ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}>
                    3. Deep Search Agent
                  </div>
                  <div className={`p-2 rounded ${processingStep >= 4 ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}>
                    4. COE Gate Pause
                  </div>
                </div>
              </div>
            )}

            {/* Launch Pipeline Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleStartIngestion}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Process PDF Ingestion & Synthesize Q&A</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DOCUMENT VAULT & 1-CLICK DOWNLOADS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  COE Document Repository & Sealed Addendums
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete repository of processed syllabi, active draft verifications, and finalized PDFs with appended COE Q&A addendums.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDocuments}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Refresh Documents"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Refresh Vault</span>
              </button>
            </div>

            {/* Documents Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-4">Course & Document</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Chunk / Vector Stats</th>
                    <th className="py-3 px-4">COE Ratification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const isCompleted = doc.status === 'Completed';
                    const isPending = doc.status === 'Pending Verification';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                                  {doc.courseCode}
                                </span>
                                <span className="font-bold text-slate-900">{doc.filename}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 block truncate max-w-sm">
                                {doc.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                            <span>{doc.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-mono font-bold">{doc.chunkCount} chunks</span>
                          <span className="text-slate-400 block text-[10px]">
                            {doc.wordCount} words • 768-D Native
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {doc.coeApprovedBy ? (
                            <div>
                              <span className="text-slate-900 font-semibold block text-[11px]">
                                {doc.coeApprovedBy}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(doc.coeApprovedAt || doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-700 italic text-[11px]">
                              Awaiting COE Approval
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocId(doc.id);
                                  setActiveTab('verification');
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verify in Queue</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenPdfPreview(doc)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Preview in Browser"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Preview</span>
                            </button>

                            <button
                              id={`btn-download-pdf-${doc.id}`}
                              type="button"
                              onClick={() => handleDownloadPdf(doc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                isCompleted
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                              <span>{isCompleted ? 'Download Appended PDF' : 'Download Raw PDF'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT Q&A PROPOSAL                                                  */}
      {/* ========================================================================= */}
      {editingQaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Q&A Proposal (Question #{editingQaItem.questionNumber})
                </h3>
              </div>
              <button
                onClick={() => setEditingQaItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Prompt:</label>
                <textarea
                  rows={3}
                  value={editingQaItem.question}
                  onChange={(e) => setEditingQaItem({ ...editingQaItem, question: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correct Answer / Key:</label>
                <textarea
                  rows={2}
                  value={editingQaItem.correctAnswer}
                  onChange={(e) => setEditingQaItem({ ...editingQaItem, correctAnswer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Valuation Rubric / Rationale:</label>
                <textarea
                  rows={2}
                  value={editingQaItem.rubricOrRationale}
                  onChange={(e) => setEditingQaItem({ ...editingQaItem, rubricOrRationale: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bloom's Taxonomy Level:</label>
                  <select
                    value={editingQaItem.bloomLevel}
                    onChange={(e) => setEditingQaItem({ ...editingQaItem, bloomLevel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                  >
                    <option value="Remembering">Remembering</option>
                    <option value="Understanding">Understanding</option>
                    <option value="Applying">Applying</option>
                    <option value="Analyzing">Analyzing</option>
                    <option value="Evaluating">Evaluating</option>
                    <option value="Creating">Creating</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Marks:</label>
                  <input
                    type="number"
                    value={editingQaItem.marks}
                    onChange={(e) => setEditingQaItem({ ...editingQaItem, marks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingQaItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(editingQaItem)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                Save & Approve Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTERACTIVE PDF PREVIEWER                                          */}
      {/* ========================================================================= */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold truncate max-w-lg">{previewPdfTitle}</h3>
              </div>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PDF Embed / Iframe */}
            <div className="flex-1 bg-slate-800 p-2">
              <iframe
                src={previewPdfUrl}
                title="PDF Document Viewer"
                className="w-full h-full rounded-lg bg-white border-0 shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
