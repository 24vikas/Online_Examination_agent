# Implementation Plan: Purely Deployable Online Course Examination System Agent
**Target Institution:** KLE Technological University  
**Architecture:** Full-stack React 19 SPA + Express (`server.ts` & `/server/`) + Firebase Admin SDK + Cloud Run Probes  
**Governing Standard:** Antigravity Master Prompt & 14-Lab AURA Coordinator State Machine

---

## 1. Executive Strategy & User Directives Alignment
Based on the clarifying questions and the completed Phase 0 audit:
1. **Full-Stack Express & Firebase Admin SDK**: Express on port 3000 serves `/api/*` with Firebase Admin `verifyIdToken` middleware, rate limiting (`express-rate-limit`), security headers (`helmet`), Zod schema validation, and Cloud Run probes (`/healthz`, `/health`, `/api/health`).
2. **Strict Hardware Proctoring**: No silent virtual stream fallback for exams. Real physical camera and microphone access are required to start a test. If physical hardware is denied or disconnected, the test hall halts with a clear prompt.
3. **Immediate Security Lockdown**: Complete overhaul of `firestore.rules`. Remove all `|| true` clauses, remove email regex role matching (`.*faculty.*`, `.*coe.*`), remove hardcoded personal emails, lock down `/users` so users cannot self-assign roles, and introduce `scripts/set-role.ts` to assign Firebase Custom Claims (`student`, `faculty`, `coe_author`).

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Security & Hardware Lockdown (Highest Priority)
- **Firestore Security Rules Overhaul (`firestore.rules`)**:
  - Restrict `isCoeAuthor()` and `isFaculty()` to `request.auth.token.role in ['COE_AUTHOR', 'faculty']` (Firebase custom claims only).
  - Remove all open patterns: remove `|| true` on `submissions`, remove `isValidId` role self-updates on `users`, remove open read/write on `/test/{testId}`.
  - Enforce field immutability on `submissions`: student can only update `responses` and `lastSavedAt` while `status == 'in_progress'` within the exam delivery window; students cannot alter `score`, `totalScore`, `facultyApproved`, or `status`.
  - Lock down `integrity_logs`: create-only for student, read-only for student and faculty, no update, no delete.
  - Lock down `grievances`: student can create and read own; only faculty/CoE can transition status or award revised marks.
  - Restrict `/exams`: students can only read active or published exams; answer keys and rubrics are restricted to faculty/CoE only.
- **Express Backend Hardening (`server.ts`, `server/apiRouter.ts`)**:
  - Install and mount `helmet`, `express-rate-limit`, and CORS origin allow-list.
  - Implement Firebase Admin token verification middleware (`authenticateToken` and `requireRole`).
  - Add Zod validation schemas for all `/api/*` request bodies.
  - Configure structured JSON logging with request IDs and sanitized error handling.
  - Provide `scripts/set-role.ts` to set custom claims using Firebase Admin SDK.
- **Strict Proctoring Enforcement (`src/utils/proctorMedia.ts`, `CandidateOnboardingModal.tsx`)**:
  - Disable automated virtual canvas stream in standard exam mode. If `navigator.mediaDevices.getUserMedia` fails, display strict hardware error requiring a real camera/microphone.
  - Restrict virtual stream strictly to an isolated sandbox test mode with a persistent "SANDBOX SIMULATION" watermark.

### Phase 2: Agent Core & Authoritative State Machine (`server/agents/`)
- **Coordinator & State Machine (`server/coordinator/stateMachine.ts`)**:
  - Implement the 9-stage state machine: `DRAFT -> ELIGIBILITY_OPEN -> REGISTRATION_CLOSED -> DELIVERY_OPEN -> DELIVERY_CLOSED -> GRADING -> FACULTY_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED`.
  - Persist state transitions to `/exam_runs/{runId}` with hash-chained audit logging (`hash = sha256(prevHash + payload)`).
- **8 Modular Agent Services (`server/agents/`)**:
  1. `eligibilityAgent.ts`: Evaluates fee clearance, attendance (>= 75%), prerequisites. Classifies records as `ELIGIBLE`, `NOT_ELIGIBLE`, or `AMBIGUOUS`. Routes ambiguous records to Faculty queue.
  2. `deliveryAgent.ts`: Server-authoritative start/end timestamps and unique question paper generation (seeded shuffle per candidate stored as `paperSeed`). Rejects submissions past window.
  3. `integrityAgent.ts`: Ingests telemetry (`tab_switch`, `fullscreen_exit`, `audio_spike`, `multiple_faces`, `multiple_login`, `timing_anomaly`). Emits **non-punitive flags only**; never auto-penalizes.
  4. `autoGradingAgent.ts`: Evaluates objective MCQs against approved answer keys. Detects and flags `KEY_MISMATCH`. Clamps scores to question `maxMarks`.
  5. `subjectiveGradingAgent.ts`: Gemini 2.5 Flash assisted evaluation with the 4-part rubric (40/30/20/10%). Sanitizes untrusted student input against prompt injection. Always sets status to `DRAFT`.
  6. `grievanceAgent.ts`: Student revaluation ticketing within 72-hour window. Requires Faculty review; zero auto-resolution.
  7. `facultyReviewAgent.ts`: Faculty approval, adjustment, and override API with mandatory reasoning and audit logging.
  8. `publishingArchiveAgent.ts`: Versioned result snapshots (`v1, v2...`), one-click rollback, CoE PDF addendum appending via `pdf-lib`, and immutable archive bundle.
- **Validation Agent (4 Hard Gate Checks)**:
  - Check 0: 100% unique question paper per candidate.
  - Check 1: Integrity logs are flags only; no automatic score deductions.
  - Check 2: All objective and subjective scores are capped at `maxMarks`.
  - Check 3: All grades remain in `DRAFT` held for Faculty sign-off.
  - Bounded self-healing retry loop (`MAX_ATTEMPTS = 3`).
- **Isolation of Out-of-Scope Features**:
  - Relocate flashcards, 50-MCQ bank, and study notes into `server/modules/study-hub/` and `server/modules/paper-setting/`.

### Phase 3: Role-Separated UI Redesign & KLE Brand Tokens
- **Design Tokens & Architecture (`src/design/tokens.css`)**:
  - KLE Technological University color tokens: Oxford Navy (`#0F2042`), Deep Blue accent (`#1E3A8A`), Crimson warning accent (`#991B1B`), neutral slate backgrounds.
  - Zero-pill metadata discipline: quiet unboxed text with typographic separators (`·`, `/`). Tabular figures for numbers/timestamps.
- **Strict Role Separation**:
  - Independent route shells: `/coe/*`, `/faculty/*`, `/student/*`. Users only see the navigation and actions appropriate to their role claim.
  - Faculty Dashboard: "Needs Your Action" priority strip (ambiguous eligibility, integrity flags, subjective drafts, open grievances), lifecycle pipeline stepper, 4 required panels (Eligibility, Integrity, Grading Queue, Results & Grievances).
  - Student Portal: Hall ticket, pre-exam system check, secure exam runner with server-clock sync and autosave, results scorecard, grievance challenge tracker.

### Phase 4: Automated Testing & Verification
- **Firestore Rules Unit Tests**: Validating denial of unauthorized role modifications, cross-student submission access, and integrity log tampering.
- **Agent Unit Tests**: Deterministic eligibility grading, window enforcement, paper seed reproducibility, flag-only integrity verification, prompt-injection defense, and 4 validation gate invariants.
- **API Integration Tests**: 401/403 auth matrix, input schema validation, rate limit responses.
- **End-to-End Pilot Flows**:
  - Pilot 1: Eligibility -> Delivery -> Objective auto-grading.
  - Pilot 2: Subjective submission -> Rubric drafting -> Faculty approval gate.
  - Pilot 3: Anomaly detection -> Flag queue -> Faculty decision without penalty.
  - Pilot 4: Published result -> Student grievance -> Faculty adjudication.

### Phase 5: Production Deployment & Hygiene
- **Repository Hygiene**: Update `package.json` name to `kle-exam-agent`, configure `npm run test` and `npm run build`.
- **Production Server Readiness**: Multi-stage Dockerfile, Cloud Run health probes on port 3000, production environment documentation.
- **Demo Script & Verification Artifacts**: `docs/DEMO_SCRIPT.md` detailing the 10-minute walkthrough.

---

## 3. Immediate Next Steps
Upon user approval of this implementation plan, execution will begin immediately with **Phase 1: Security Lockdown**.
