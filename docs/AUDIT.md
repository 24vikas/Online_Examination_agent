# Online Course Examination System Agent — Comprehensive Phase 0 Audit Report
**Target Institution:** KLE Technological University  
**Audited Subsystems:** React 19 Frontend, Node.js/Express Server (`server.ts`, `server/apiRouter.ts`, `server/antigravityTelemetryBridge.ts`, `server/geminiHandler.ts`, `server/coeDocumentService.ts`), Firebase Firestore & Auth Configuration (`firestore.rules`, `src/firebase/*`), and AI Studio/Antigravity Agent Pipelines.  
**Audit Date:** Phase 0 Baseline  
**Scope Notice:** Read-only audit with zero code modifications. Complete assessment against the Antigravity Master Prompt, 14-Lab Worklet Specification, and KLE Tech Security Invariants.

---

## 1. Inventory of Every `/api/*` Route

The application mounts routes through Express (`server.ts`) and an HTTP delegate router (`server/apiRouter.ts`). Every route was evaluated for:
- **Auth Required:** Whether Firebase ID Token verification (`verifyIdToken`) is enforced before processing.
- **Role Required:** Whether caller role claims (`student`, `faculty`, `coe_author`) are cryptographically verified.
- **Input Validation:** Whether inputs are validated against a strict schema (e.g. Zod).
- **Rate Limited:** Whether express-rate-limit or IP/token throttling is applied.
- **Data Source (Real vs. Simulated):** Whether execution invokes live external APIs/persisted storage or falls back to synthetic in-memory mocks.

| # | Route | Method | Auth Required | Role Required | Input Validation | Rate Limited | Data Source (Real vs. Simulated) | Handler Function & Source File |
|---|---|---|---|---|---|---|---|---|
| 1 | `/healthz` | `GET` | No | None | None | No | Real (Node `process.uptime()`) | `server.ts` & `server/apiRouter.ts:70` |
| 2 | `/health` | `GET` | No | None | None | No | Real (Node `process.uptime()`) | `server.ts` & `server/apiRouter.ts:70` |
| 3 | `/api/health` | `GET` | No | None | None | No | Real (Timestamp & Status) | `server.ts` & `server/apiRouter.ts:338` |
| 4 | `/api/gemini/generate-questions` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Fallback** (Calls Gemini, falls back to `mockQuestions`) | `handleGenerateQuestions` (`server/geminiHandler.ts:188`) |
| 5 | `/api/gemini/grade-subjective` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Fallback** (Calls Gemini, falls back to static rubric score) | `handleGradeSubjective` (`server/geminiHandler.ts:310`) |
| 6 | `/api/gemini/academic-chat` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Fallback** (Calls Gemini, falls back to mock tutoring reply) | `handleAcademicChat` (`server/geminiHandler.ts:420`) |
| 7 | `/api/gemini/analyze-integrity` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Fallback** (Calls Gemini, falls back to static heuristic flags) | `handleAnalyzeIntegrity` (`server/geminiHandler.ts:512`) |
| 8 | `/api/gemini/rag-index` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Store** (Stores in-memory in `ragStore` Map, not vector DB) | `handleRagIndex` (`server/geminiHandler.ts:179`) |
| 9 | `/api/gemini/rag-query` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Match** (Keyword search over `ragStore` + Gemini synthesis) | `handleRagQuery` (`server/geminiHandler.ts:240`) |
| 10 | `/api/gemini/extract-pdf` | `POST` | **No (Open)** | None | 10MB byte check | **No** | Real (`pdf-parse` with regex fallback) | `handleExtractPdf` (`server/geminiHandler.ts:285`) |
| 11 | `/api/gemini/create-study-notes` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated Fallback** (Gemini with hardcoded static study note fallback) | `handleCreateStudyNotes` (`server/geminiHandler.ts:600`) |
| 12 | `/api/gemini/generate-flashcards` | `GET/POST`| **No (Open)** | None | Manual parse | **No** | **Simulated Static** (Serves 100 hardcoded cards from `academicKnowledgeBase.ts`) | `handleGenerateFlashcards` (`server/geminiHandler.ts:680`) |
| 13 | `/api/gemini/generate-notes` | `GET/POST`| **No (Open)** | None | Manual parse | **No** | **Simulated Static** (Serves static notes from `academicKnowledgeBase.ts`) | `handleGenerateStudyNotes` (`server/geminiHandler.ts:740`) |
| 14 | `/api/gemini/subject-bank` | `GET/POST`| **No (Open)** | None | Manual parse | **No** | **Simulated Static** (Serves 50 static MCQs, flashcards, notes) | `handleGetSubjectBank` (`server/geminiHandler.ts:800`) |
| 15 | `/api/agent/system-status` | `GET/POST`| **No (Open)** | None | None | **No** | Hybrid (In-memory `auraRunStateStore` + static lab metric counters) | `handleGetSystemStatus` (`server/geminiHandler.ts:860`) |
| 16 | `/api/agent/planner-loop` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Deterministic mock planner sequence) | `handleAgentPlannerLoop` (`server/geminiHandler.ts:920`) |
| 17 | `/api/agent/run-tool` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Mock tool sandbox: calculator, db-lookup) | `handleRunDeterministicTool` (`server/geminiHandler.ts:980`) |
| 18 | `/api/agent/run-skill` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Mock skill executor) | `handleRunReusableSkill` (`server/geminiHandler.ts:1040`) |
| 19 | `/api/agent/mcp-connector` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Mock MCP JSON-RPC protocol echo) | `handleMcpConnector` (`server/geminiHandler.ts:1100`) |
| 20 | `/api/agent/governed-runtime` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Static policy rule checks) | `handleGovernedRuntime` (`server/geminiHandler.ts:1160`) |
| 21 | `/api/agent/node-graph` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (In-memory node step iterator) | `handleNodeGraphPipeline` (`server/geminiHandler.ts:1220`) |
| 22 | `/api/agent/parallel-swarm` | `POST` | **No (Open)** | None | Manual parse | **No** | **Simulated** (Synthetic 3-worker concurrency loop) | `handleParallelSwarm` (`server/geminiHandler.ts:1280`) |
| 23 | `/api/agent/verify-gate-checks` | `GET/POST`| **No (Open)** | None | None | **No** | **Simulated** (Returns static 100% pass for tests 0–3) | `handleRunAllGateChecks` (`server/geminiHandler.ts:1340`) |
| 24 | `/api/agent/aura-dispatch` | `POST` | **No (Open)** | None | Basic switch | **No** | Real / In-memory bridge (Routes 8 AURA tools, in-memory state) | `handleAuraToolDispatch` (`server/antigravityTelemetryBridge.ts:72`) |
| 25 | `/api/agent/aura-approval` | `POST` | **No (Open)** | None | Manual parse | **No** | In-memory token store (Generates unverified token string) | `issueFacultyApprovalToken` (`server/antigravityTelemetryBridge.ts:310`) |
| 26 | `/api/coe/documents` | `GET` | **No (Open)** | None | None | **No** | In-memory (`storedDocuments` Map seeded on boot) | `getAllCoeDocuments` (`server/coeDocumentService.ts:34`) |
| 27 | `/api/coe/document` (and `/:id`) | `GET` | **No (Open)** | None | ID query/param | **No** | In-memory (`storedDocuments`, `storedChunks`, `storedQaProposals`) | `getCoeDocumentDetails` (`server/coeDocumentService.ts:50`) |
| 28 | `/api/coe/upload-and-process` | `POST` | **No (Open)** | None | 10MB limit | **No** | Hybrid (Real `pdf-parse` & `pdf-lib` + mock vector `[0.1, 0.2..]` fallback) | `processPdfIngestionPipeline` (`server/coeDocumentService.ts:714`) |
| 29 | `/api/coe/approve-and-append` | `POST` | **No (Open)** | None | Manual parse | **No** | Real (`pdf-lib` appends physical pages to PDF in memory) | `executeCoeApprovalAndAppend` (`server/coeDocumentService.ts:500`) |
| 30 | `/api/coe/sample-pdf` | `GET/POST`| **No (Open)** | None | None | **No** | Real (`pdf-lib` creates clean curriculum PDF bytes) | `createSampleCurriculumPdfBytes` (`server/coeDocumentService.ts:20`) |

---

## 2. Inventory of Simulated / Mock Fallbacks Across Codebase

Every location where execution falls back to synthetic, local, or mocked behavior is identified below:

1. **Gemini HTTP 429 (Quota Exceeded) & 404 (Model Not Found) Fallbacks:**
   - **Locations:** `server/apiRouter.ts:346-372`, `server/geminiHandler.ts:86-100`, `server/coeDocumentService.ts:179-188`.
   - **Behavior:** Catches HTTP 429, 404, `RESOURCE_EXHAUSTED`, or quota errors and returns 200 OK with `isSimulatedFallback: true` and dummy response objects.
   - **Defect:** In several endpoints (e.g. `academic-chat`, `grade-subjective`), fallback data could be mistaken for authentic AI output by callers if not explicitly marked.

2. **Embedding Vectors & Native Vector Search:**
   - **Location:** `server/coeDocumentService.ts:167-189` (`generateNativeEmbeddingVector`).
   - **Behavior:** Attempts `ai.models.embedContent({ model: 'gemini-embedding-2-preview' })`. On any failure, produces a synthetic 768-dimensional float array: `vector[i] = Number((((i % 10) + 1) * 0.1).toFixed(2))`.
   - **Defect:** Does not persist to Firestore using `FieldValue.vector()` in cloud storage; stored in transient server memory (`storedChunks`).

3. **External Search Grounding (Tavily / Serper):**
   - **Location:** `server/coeDocumentService.ts:810-817`.
   - **Behavior:** Code states "Synthesized context benchmark against external search APIs", but hardcodes a static source array referencing `https://kletech.ac.in/academic-regulations`.
   - **Defect:** No actual HTTP request to Tavily or Serper is dispatched; search context is generated purely by prompt hallucination or static string interpolation.

4. **Virtual Proctor Camera Stream:**
   - **Location:** `src/utils/proctorMedia.ts:21-120` (`createVirtualProctorStream`).
   - **Behavior:** When physical webcam access fails, is blocked by iframe, or denied, a `<canvas>` renders an animated silhouette with an inaudible 0.001 gain web audio tone.
   - **Defect:** In a high-stakes exam setting, this permits candidates to bypass physical video proctoring entirely. The virtual stream lacks an immutable "DEMO MODE ONLY" restriction and watermark.

5. **Biometric Face Verification:**
   - **Location:** `src/components/student/CandidateOnboardingModal.tsx:140-165`.
   - **Behavior:** Takes a snapshot canvas frame, hashes length, and marks `biometricVerified: true`.
   - **Defect:** Performs no actual face detection, landmark comparison, or biometric matching against a reference ID.

6. **In-Memory Agent Lifecycle & Labs 1–8 Handlers:**
   - **Location:** `server/geminiHandler.ts:920-1380`.
   - **Behavior:** Handlers for `planner-loop`, `run-tool`, `run-skill`, `mcp-connector`, `governed-runtime`, `node-graph`, `parallel-swarm`, and `verify-gate-checks` simulate outputs via JSON templates rather than executing real sandbox containers or actual worker threads.

7. **Seed Data & Local Storage Fallback:**
   - **Location:** `src/firebase/seedData.ts` & `src/firebase/services.ts:44-60`.
   - **Behavior:** If Firestore operations fail due to permissions or network disconnection, `services.ts` silently falls back to `localStorage` and `INITIAL_*` seed records.

---

## 3. Firestore Collections and Current Access Permissions (`firestore.rules`)

Evaluation of `firestore.rules` as currently written in the repository:

| Collection Path | Read Rule in File | Write Rule in File | Vulnerabilities & Reviewer Findings |
|---|---|---|---|
| `/{document=**}` | `false` | `false` | Global safety net present. |
| `/test/{testId}` | `allow read, write: if true;` | `allow read, write: if true;` | **CRITICAL:** Completely open to unauthenticated public read/write. |
| `/users/{userId}` | `isSignedIn()` (get & list) | `isSignedIn() && (isOwner(userId) \|\| isCoeAuthor() \|\| isValidId(userId))` | **CRITICAL:** `isValidId(userId)` evaluates to true for standard user IDs, allowing **any student** to update their own or any other user's profile to change `role: 'faculty'`, `attendanceRate: 100`, or `feeCleared: true`. |
| `/exams/{examId}` | `isSignedIn()` (get & list) | `(isCoeAuthor() \|\| isSignedIn()) && isValidId(examId)` (create, update, delete) | **CRITICAL:** Any authenticated user (including students) can create, edit, or delete exams and view draft unreleased exams. |
| `/exams/{examId}/questions/{qId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | **CRITICAL:** Students can read questions before exam window; any user can modify exam questions. |
| `/questions/{questionId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | **CRITICAL:** Centralized question bank is readable and writable by any authenticated student. |
| `/submissions/{submissionId}` | `isCoeAuthor() \|\| (isSignedIn() && (... \|\| true))` | `isCoeAuthor() \|\| (isSignedIn() && (... \|\| true))` | **CRITICAL:** The expression contains `\|\| true`, allowing **any student to read and overwrite any other student's submission**, self-award marks, or alter answers post-deadline. |
| `/integrity_logs/{logId}` & `/integrityLogs/{logId}` | `isSignedIn()` | `create: isSignedIn()`, `update: isCoeAuthor() \|\| isSignedIn()`, `delete: false` | **HIGH:** `update` is allowed for `isSignedIn()`. A student caught cheating can update their own integrity log to erase evidence or alter severity to 'low'. Duplicate collection names exist. |
| `/grievances/{grievanceId}` | `isSignedIn()` | `create: isSignedIn()`, `update: isCoeAuthor() \|\| isSignedIn()` | **HIGH:** Any student can update any grievance, allowing a student to self-resolve their own revaluation and set `status: 'Resolved'` or award revised marks. |
| `/registrations/{registrationId}` | `isSignedIn()` | `create, update: isSignedIn() && isValidId(...)` | **HIGH:** Students can bypass the Registration & Eligibility Agent and directly create their own verified hall ticket. |
| `/documents/{docId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | **HIGH:** Syllabus documents can be altered by any signed-in user. |
| `/document_chunks/{chunkId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | **HIGH:** Chunks can be modified by any signed-in user. |
| `/qa_proposals/{qaId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | **HIGH:** Any user can approve or alter COE Q&A proposals. |
| `/audit_logs/{logId}` | `isSignedIn()` | `create: isSignedIn()`, `update, delete: false` | Append-only invariant is preserved, but any signed-in user can forge audit log entries. |
| `/tenants/{tenantId}/courses/{courseId}` | `isSignedIn()` | `isCoeAuthor() \|\| isSignedIn()` | Course catalog writable by any authenticated user. |

### Flawed Helper Functions in `firestore.rules`:
1. **Hardcoded Admin Email:** Line 29 checks `request.auth.token.email == 'uvikasbadiger@gmail.com'`. Personal email committed to public security configuration.
2. **Insecure Role Inference via Regex:** Lines 50–56 check `request.auth.token.email.matches('.*faculty.*')`, `.*coe.*`, `.*admin.*`. Any user can register `faculty.attacker@gmail.com` and gain full faculty privileges.
3. **No Claim Enforcement:** Roles must come strictly from Firebase custom claims set server-side via the Admin SDK, never client-controlled doc attributes or email string patterns.

---

## 4. Spec-Coverage Matrix (Agents 0–8, 4 Hard Checks, 5 Guardrails)

Status Definitions:
- **Implemented:** Full functionality exists, is backed by real code, and adheres to the specification.
- **Partial:** Basic logic or UI exists, but lacks server authority, contains security bypasses, or relies on mock fallbacks.
- **Missing:** Not present in the codebase.

| Component / Requirement | Status | Current Code Location & Evidence | Detailed Findings & Deficiencies |
|---|---|---|---|
| **Agent 0: Coordinator** | **Partial** | `server/antigravityTelemetryBridge.ts:72`, `server/geminiHandler.ts:920` | Coordinates states in-memory (`auraRunStateStore`); lacks persistent Firestore state machine, tamper-evident hash-chaining, and CLI runner. |
| **Agent 1: Registration & Eligibility** | **Partial** | `server/antigravityTelemetryBridge.ts:96`, `src/components/student/StudentEligibilityAndExams.tsx` | Evaluates fee status and attendance percentage. Lacks: configurable `--eligibility` options, explicit prerequisite clearance verification, and `AMBIGUOUS` state routing to Faculty queue. |
| **Agent 2: Exam Delivery** | **Partial** | `server/antigravityTelemetryBridge.ts:117`, `src/components/student/ExamRunner.tsx` | Enforces client timer and generates token. Lacks: server-authoritative clock enforcement, unique question paper permutation per candidate, and faculty-approved `session_extension` record. |
| **Agent 3: Proctoring & Integrity** | **Partial** | `server/antigravityTelemetryBridge.ts:144`, `src/utils/proctorMedia.ts` | Logs tab switches and fullscreen exits. Lacks: multiple login detection, timing anomaly analysis (e.g. 50 items in 20 seconds), and automated proof that no penalties are auto-applied. |
| **Agent 4: Auto-Grading (Objective)** | **Partial** | `server/antigravityTelemetryBridge.ts:162` | Evaluates MCQs and caps marks at `maxMarks`. Lacks: `KEY_MISMATCH` detection for invalid answer keys, negative marking support, and bounded parallel batch evaluation (`p-limit`). |
| **Agent 5: Subjective Grading Assist** | **Partial** | `server/antigravityTelemetryBridge.ts:192`, `server/geminiHandler.ts:310` | 4-criterion rubric grading implemented. Lacks: prompt-injection defense against adversarial student answers, confidence scores, and structured "needs-human-attention" flags. |
| **Agent 6: Grievance & Revaluation** | **Partial** | `server/antigravityTelemetryBridge.ts:278`, `src/components/faculty/FacultyGrievanceQueue.tsx` | Workflow exists. Lacks: strict 72-hour filing deadline enforcement; Firestore rules currently permit students to update grievance status directly. |
| **Agent 7: Faculty Review** | **Partial** | `src/components/faculty/ReviewsAndGrading.tsx`, `server/antigravityTelemetryBridge.ts:224` | UI for grade review exists. Lacks: split-view layout with keyboard shortcuts (J/K/A), mandatory reason logging for marks adjustments, and bulk-approval restriction to objective items only. |
| **Agent 8: Result Publishing & Archive** | **Partial** | `server/antigravityTelemetryBridge.ts:256`, `server/coeDocumentService.ts:500` | PDF addendum appending works. Lacks: versioned publish snapshots (`v1, v2...`), one-click rollback functionality, and immutable cold archive storage. |
| **Validation Check 0: Unique Paper** | **Partial** | `server/antigravityTelemetryBridge.ts:129` | Generates a seed string (`SEED-...`), but does not actually shuffle questions/options or guarantee paper uniqueness across 100 students. |
| **Validation Check 1: Flag-Only Integrity** | **Partial** | `server/antigravityTelemetryBridge.ts:149` | Sets `autoPenaltyApplied: false`, but lacks automated property tests verifying no code path ever penalizes or disqualifies. |
| **Validation Check 2: Capped Auto-Grades** | **Partial** | `server/antigravityTelemetryBridge.ts:167, 202` | Uses `Math.min(score, maxMarks)`, but lacks fuzzing tests across edge cases (negative, decimal, malformed). |
| **Validation Check 3: Held for Human Sign-off** | **Partial** | `server/antigravityTelemetryBridge.ts:209` | Output marked as `DRAFT`, but Firestore rules allow clients to write `status: 'published'` or `facultyApproved: true`. |
| **Self-Healing Loop (MAX_ATTEMPTS = 3)** | **Missing** | N/A | `/api/agent/verify-gate-checks` returns static true. No automated regeneration or bounded repair of failing units. |
| **Guardrail 1: Human Final Authority** | **Partial** | `server/antigravityTelemetryBridge.ts:257` | AURA bridge requires token, but backend routes lack JWT auth and Firestore rules are bypassable. |
| **Guardrail 2: Flag-Only Proctoring** | **Partial** | `server/antigravityTelemetryBridge.ts:148` | Present in bridge contract; unverified by unit/e2e test suite. |
| **Guardrail 3: Delivery Window Lock** | **Partial** | `src/components/student/ExamRunner.tsx` | Enforced only in React client component; server accepts submission payloads at any time. |
| **Guardrail 4: Grading Ceiling & Rubric** | **Partial** | `server/antigravityTelemetryBridge.ts:195-202` | Rubric math clamps to max; lacks syllabus evidence citation verification per item. |
| **Guardrail 5: Dirty Dozen Defense** | **Missing** | `firestore.rules:1-206`, `server.ts:33-42` | Contradicted by current rules (`|| true`, `isValidId` role-escalation, CORS `*`, unauthenticated API). |

---

## 5. Out-of-Scope Features to Preserve (Phase 2 Isolation)

The following components were built in earlier sprints and are valuable for academic study and curriculum preparation. They are **not** part of the core 8-Agent examination delivery lifecycle and will be cleanly preserved under isolated modules (`server/modules/study-hub/` and `server/modules/paper-setting/`) without deletion:

1. **Academic Study Hub & Flashcards:**
   - 100 Concept-Wise Flashcards (`/api/gemini/generate-flashcards`)
   - 50 MCQ Academic Question Bank (`/api/gemini/subject-bank`)
   - High-Yield Study Notes Generator (`/api/gemini/generate-notes`, `/api/gemini/create-study-notes`)
   - Academic Study Portal UI (`src/components/student/AcademicStudyPortal.tsx`)
2. **Interactive Academic Chat:**
   - Real-time tutoring assistant (`/api/gemini/academic-chat`, `src/components/chat/AcademicChatDrawer.tsx`)
3. **Curriculum RAG Studio & Question Paper Ingestion:**
   - Syllabus chunking & semantic search (`/api/gemini/rag-index`, `/api/gemini/rag-query`)
   - Question Generator Studio (`src/components/faculty/QuestionGenerator.tsx`)
   - Self-paced practice tests (`src/components/student/PracticeTests.tsx`)

---

## 6. Audit Summary & Conclusion

- **Security Posture:** Critical vulnerabilities exist in `firestore.rules` (open collections, role escalation via `isValidId`, cross-student submission access via `|| true`, email regex roles) and Express backend (lack of Firebase Admin token verification, permissive CORS `*`, missing rate limiting).
- **Proctoring Posture:** High-stakes testing currently permits virtual stream fallback without physical webcam verification or demo watermarks.
- **Agent Lifecycle:** The 8 agents and validation checks are structurally modeled in `server/antigravityTelemetryBridge.ts`, but operate on in-memory state and require full persistence, server-authoritative time, and real test coverage.
- **Phase 0 Status:** Audit complete. No code has been modified. Ready for Phase 1 upon user confirmation.
