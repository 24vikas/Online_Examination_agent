import type { Request, Response } from 'express';
import { handleAuraToolDispatch, auraRunStateStore, issueFacultyApprovalToken } from './antigravityTelemetryBridge.ts';
import {
  handleGenerateQuestions,
  handleGradeSubjective,
  handleAcademicChat,
  handleAnalyzeIntegrity,
  handleRagIndex,
  handleRagQuery,
  handleExtractPdf,
  handleCreateStudyNotes,
  handleGenerateFlashcards,
  handleGenerateStudyNotes,
  handleGetSubjectBank,
  handleGetSystemStatus,
  handleAgentPlannerLoop,
  handleRunDeterministicTool,
  handleRunReusableSkill,
  handleMcpConnector,
  handleGovernedRuntime,
  handleNodeGraphPipeline,
  handleParallelSwarm,
  handleRunAllGateChecks,
} from './geminiHandler.ts';
import {
  seedInitialCoeDocuments,
  getAllCoeDocuments,
  getCoeDocumentDetails,
  processPdfIngestionPipeline,
  executeCoeApprovalAndAppend,
  createSampleCurriculumPdfBytes,
} from './coeDocumentService.ts';
import {
  authenticateToken,
  requireRole,
  validateBody,
  logger,
  generalApiLimiter,
  geminiQuotaLimiter,
  agentOrchestratorLimiter,
} from './securityMiddleware.ts';
import {
  generateQuestionsSchema,
  gradeSubjectiveSchema,
  academicChatSchema,
  analyzeIntegritySchema,
  ragIndexSchema,
  ragQuerySchema,
  extractPdfSchema,
  coeUploadSchema,
  coeApproveAppendSchema,
  auraDispatchSchema,
} from './schemas.ts';

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        body = '';
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export async function handleApiRequest(req: any, res: any): Promise<boolean> {
  const fullUrl = req.url || '';
  const url = fullUrl.split('?')[0];

  // Polyfill Express helpers if running under Connect/Vite dev middleware
  if (!res.status) {
    res.status = function (code: number) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function (data: any) {
      if (!this.headersSent) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
      }
      return this;
    };
  }
  if (!res.sendStatus) {
    res.sendStatus = function (code: number) {
      this.statusCode = code;
      this.end();
      return this;
    };
  }

  // Parse body if not parsed by Express
  if (!req.body && (req.method === 'POST' || req.method === 'PUT')) {
    req.body = await readJsonBody(req);
  }

  // Health checks are always open
  if (url === '/healthz' || url === '/health' || url === '/api/health') {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'KLE Tech Online Exam System Agent',
    });
    return true;
  }

  if (!url.startsWith('/api/')) {
    return false;
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return true;
  }

  // Helper for running express middleware in async sequence
  const runMiddleware = (middlewareFn: (req: Request, res: Response, next: (err?: any) => void) => void): Promise<boolean> => {
    return new Promise((resolve) => {
      middlewareFn(req, res, (err) => {
        if (err || res.headersSent) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  try {
    // -------------------------------------------------------------
    // 1. GEMINI & STUDY HUB ENDPOINTS (Rate limited + Authenticated)
    // -------------------------------------------------------------
    if (url.startsWith('/api/gemini/')) {
      const allowed = await runMiddleware(geminiQuotaLimiter);
      if (!allowed) return true;

      const authOk = await runMiddleware(authenticateToken);
      if (!authOk) return true;

      if (url === '/api/gemini/generate-questions' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(generateQuestionsSchema));
        if (!valOk) return true;
        const result = await handleGenerateQuestions(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/grade-subjective' && req.method === 'POST') {
        const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
        if (!roleOk) return true;
        const valOk = await runMiddleware(validateBody(gradeSubjectiveSchema));
        if (!valOk) return true;
        const result = await handleGradeSubjective(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/academic-chat' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(academicChatSchema));
        if (!valOk) return true;
        const result = await handleAcademicChat(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/analyze-integrity' && req.method === 'POST') {
        const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
        if (!roleOk) return true;
        const valOk = await runMiddleware(validateBody(analyzeIntegritySchema));
        if (!valOk) return true;
        const result = await handleAnalyzeIntegrity(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/rag-index' && req.method === 'POST') {
        const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
        if (!roleOk) return true;
        const valOk = await runMiddleware(validateBody(ragIndexSchema));
        if (!valOk) return true;
        const result = await handleRagIndex(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/rag-query' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(ragQuerySchema));
        if (!valOk) return true;
        const result = await handleRagQuery(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/extract-pdf' && req.method === 'POST') {
        const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
        if (!roleOk) return true;
        const valOk = await runMiddleware(validateBody(extractPdfSchema));
        if (!valOk) return true;
        const result = await handleExtractPdf(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/create-study-notes' && req.method === 'POST') {
        const result = await handleCreateStudyNotes(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/generate-flashcards' && (req.method === 'POST' || req.method === 'GET')) {
        const result = await handleGenerateFlashcards(req.body || {});
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/generate-notes' && (req.method === 'POST' || req.method === 'GET')) {
        const result = await handleGenerateStudyNotes(req.body || {});
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/gemini/subject-bank' && (req.method === 'POST' || req.method === 'GET')) {
        const result = await handleGetSubjectBank(req.body || {});
        res.status(200).json({ success: true, data: result });
        return true;
      }
    }

    // -------------------------------------------------------------
    // 2. AGENTIC ORCHESTRATION & AURA BRIDGE
    // -------------------------------------------------------------
    if (url.startsWith('/api/agent/')) {
      const allowed = await runMiddleware(agentOrchestratorLimiter);
      if (!allowed) return true;

      // Status check is open for live state monitoring
      if ((url === '/api/agent/system-status' || url === '/api/agent/status') && (req.method === 'GET' || req.method === 'POST')) {
        const result = await handleGetSystemStatus();
        res.status(200).json({
          success: true,
          data: {
            ...result,
            auraCoordinatorSync: {
              activeRuns: Object.values(auraRunStateStore),
              count: Object.keys(auraRunStateStore).length,
              lastSyncTimestamp: new Date().toISOString(),
            },
          },
        });
        return true;
      }

      const authOk = await runMiddleware(authenticateToken);
      if (!authOk) return true;

      // Tool dispatch endpoint
      if (url === '/api/agent/aura-dispatch' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(auraDispatchSchema));
        if (!valOk) return true;
        await handleAuraToolDispatch(req.body, res);
        return true;
      }

      // Faculty sign-off approval endpoint (strictly Faculty/COE)
      if (url === '/api/agent/aura-approval' && req.method === 'POST') {
        const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
        if (!roleOk) return true;
        const examId = req.body.examId || '25ECSC307';
        const role = req.user?.role || 'FACULTY';
        const token = issueFacultyApprovalToken(examId, role as any);
        res.status(200).json({ success: true, token, examId, approverRole: role });
        return true;
      }

      // Labs 1-8 internal test endpoints
      if (url === '/api/agent/planner-loop' && req.method === 'POST') {
        const result = await handleAgentPlannerLoop(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/run-tool' && req.method === 'POST') {
        const result = await handleRunDeterministicTool(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/run-skill' && req.method === 'POST') {
        const result = await handleRunReusableSkill(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/mcp-connector' && req.method === 'POST') {
        const result = await handleMcpConnector(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/governed-runtime' && req.method === 'POST') {
        const result = await handleGovernedRuntime(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/node-graph' && req.method === 'POST') {
        const result = await handleNodeGraphPipeline(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/parallel-swarm' && req.method === 'POST') {
        const result = await handleParallelSwarm(req.body);
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/agent/verify-gate-checks' && (req.method === 'POST' || req.method === 'GET')) {
        const result = await handleRunAllGateChecks();
        res.status(200).json({ success: true, data: result });
        return true;
      }
    }

    // -------------------------------------------------------------
    // 3. COE DOCUMENT PROCESSING & PDF APPENDER (Strictly COE/Faculty)
    // -------------------------------------------------------------
    if (url.startsWith('/api/coe/')) {
      const allowed = await runMiddleware(generalApiLimiter);
      if (!allowed) return true;

      const authOk = await runMiddleware(authenticateToken);
      if (!authOk) return true;

      const roleOk = await runMiddleware(requireRole(['FACULTY', 'COE_AUTHOR']));
      if (!roleOk) return true;

      if (url === '/api/coe/documents' && req.method === 'GET') {
        const docs = getAllCoeDocuments();
        res.status(200).json({ success: true, data: docs });
        return true;
      }

      if ((url === '/api/coe/document' || url.startsWith('/api/coe/document/')) && req.method === 'GET') {
        let docId = '';
        if (url.startsWith('/api/coe/document/')) {
          docId = url.replace('/api/coe/document/', '');
        } else {
          docId = (req.query?.id as string) || '';
        }
        const details = getCoeDocumentDetails(docId);
        res.status(200).json({ success: true, data: details });
        return true;
      }

      if (url === '/api/coe/upload-and-process' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(coeUploadSchema));
        if (!valOk) return true;
        const payload = req.body;
        if (!payload.pdfBase64) {
          const sampleBytes = await createSampleCurriculumPdfBytes(payload.courseCode || 'CS-301', payload.title || 'Curriculum Syllabus');
          payload.pdfBase64 = `data:application/pdf;base64,${Buffer.from(sampleBytes).toString('base64')}`;
        }
        const result = await processPdfIngestionPipeline({
          filename: payload.filename || 'Curriculum-Syllabus.pdf',
          courseCode: payload.courseCode || 'CS-301',
          title: payload.title || 'Distributed Systems & Cloud Computing',
          pdfBase64: payload.pdfBase64,
          uploadedBy: payload.uploadedBy || req.user?.email || 'Faculty Course Lead',
        });
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/coe/approve-and-append' && req.method === 'POST') {
        const valOk = await runMiddleware(validateBody(coeApproveAppendSchema));
        if (!valOk) return true;
        const result = await executeCoeApprovalAndAppend({
          docId: req.body.docId,
          approvedQaIds: req.body.approvedQaIds || [],
          editedQaItems: req.body.editedQaItems,
          coeUser: req.body.coeUser || { id: req.user?.uid || 'coe_lead', displayName: req.user?.email || 'COE Author', role: 'author' },
          coeNotes: req.body.coeNotes,
        });
        res.status(200).json({ success: true, data: result });
        return true;
      }

      if (url === '/api/coe/sample-pdf' && (req.method === 'GET' || req.method === 'POST')) {
        const sampleBytes = await createSampleCurriculumPdfBytes();
        const base64 = Buffer.from(sampleBytes).toString('base64');
        res.status(200).json({
          success: true,
          data: {
            filename: 'CS301-Distributed-Systems-Curriculum.pdf',
            courseCode: 'CS-301',
            title: 'Distributed Systems & Cloud Computing',
            pdfBase64: `data:application/pdf;base64,${base64}`,
          },
        });
        return true;
      }
    }

    res.status(404).json({ error: 'API route not found', path: url });
    return true;
  } catch (err: any) {
    const isQuotaOr404 =
      err?.status === 429 ||
      err?.status === 404 ||
      err?.code === 429 ||
      err?.code === 404 ||
      (err?.message &&
        (err.message.includes('429') ||
          err.message.includes('404') ||
          err.message.toLowerCase().includes('quota') ||
          err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('resource_exhausted')));

    if (isQuotaOr404) {
      logger.warn({ url, error: err.message }, '[API Graceful Fallback] Returning simulated fallback response');
      res.status(200).json({
        success: true,
        simulated: true,
        isSimulatedFallback: true,
        fallbackNotice: 'API Quota Exceeded: Using simulated AI fallback data for testing.',
        data: {
          message: 'API Quota Exceeded: Using simulated AI fallback data for testing.',
          simulated: true,
          status: 'fallback_active',
        },
      });
      return true;
    }

    logger.error({ url, error: err.message, stack: err.stack }, '[Server API Unhandled Error]');
    res.status(500).json({
      error: err.message || 'Internal server error',
      requestId: req.requestId,
    });
    return true;
  }
}
