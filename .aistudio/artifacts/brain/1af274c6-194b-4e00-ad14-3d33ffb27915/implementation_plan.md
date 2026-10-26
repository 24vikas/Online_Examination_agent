# Institutional Examination Agent: Clean UI Redesign & Role Architecture

A complete frontend UI modernization for the Online Course Examination System Agent (KLE Technological University). This redesign transforms the interface into a role-tailored academic management dashboard for faculty and COE administrators, provides a focused, accessible testing portal for students, replaces dark decorative heroes with an actionable operations hub, and establishes a single disciplined navy palette with WCAG AA compliance.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed with the user prior to drafting this implementation plan:

- **Confirmed Decision 1 (Action & Stepper Navigation)**: When a user clicks a lifecycle stepper stage or "Needs your action" metric card, the system will switch directly to the corresponding tab and auto-filter the item queue in place.
- **Confirmed Decision 2 (Student Layout Architecture)**: Students receive a dedicated, distraction-free Student Portal layout with simplified top-bar navigation (Course Eligibility, Testing Hall / Practice, Scorecard & Transcripts, Grievance Petitions) without exposing any COE or Faculty administration panels.
- **Confirmed Decision 3 (Simulated Data Indicator)**: A persistent slim notification banner with an info icon, concise context ("Simulated institutional data active"), and an accessible dismiss action will appear whenever fallback/seed data is active.
- **Confirmed Decision 4 (Demo Switcher Placement)**: The "Switch Demo Profile" dropdown is removed from permanent navigation and isolated into a collapsible drawer/dock visible strictly when `VITE_DEMO_MODE=true`.

---

## 1. Overview & Core Concept

- **What It Does**: The application governs the entire university examination lifecycle—from syllabus RAG question generation and eligibility checks to proctored delivery, auto-grading, faculty review gates, and grievance handling.
- **Target Audience / Personas**:
  1. **COE Authors & Faculty Invigilators**: Need high-density, scannable queues to ratify questions, review proctoring flags with non-punitive language, approve AI rubrics, and publish official marks.
  2. **Enrolled Students**: Need a clean, stress-free portal to verify exam clearances, take timed exams with camera checks, review grade cards, and submit formal revaluation appeals.
- **Key Value**: Replaces AI-slop visual gradients and cluttered card sandwiches with enterprise-grade tabular views, clear lifecycle state tracking, and zero accidental role leakage.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **COE & Faculty Executive Workflow**:
   - Administrator arrives at the **Overview** tab.
   - The top displays the **Needs Your Action** strip:
     - Ambiguous Eligibility Cases (attendance/fee disputes)
     - Proctoring Review Flags (non-punitive audio/visual variance logs)
     - Subjective Grading Drafts (AI rubric proposals awaiting human sign-off)
     - Open Student Grievances (revaluation petitions)
   - Clicking any action card smoothly navigates to the dedicated tab with the filter pre-applied.
   - The **Horizontal Examination Lifecycle Stepper** gives immediate visual status across all 7 stages:
     `Eligibility (N) → Delivery (N) → Integrity + Auto-Grade (N) → Subjective Grading (N) → [Faculty Review Gate (N) in Amber] → Publish (N) → Grievances (N)`.
   - The **Exam Master Table** provides full, untruncated course titles with tooltip previews, code badges, format chips, duration, total and pass marks aligned on the same row, delivery window, and quick action buttons.

2. **Dedicated Student Portal Flow**:
   - Students land directly in their clean **Student Portal**.
   - Top bar contains student-specific navigation links:
     - `Courses & Eligibility`: Clear status of 75% attendance and fee clearance.
     - `Testing Hall`: Onboarding, virtual camera checks, and active exam launchers.
     - `Scorecards`: Verified transcripts and rubric breakdowns.
     - `Grievances`: Revaluation appeal petitions and faculty resolutions.
   - Sidebar navigation for faculty/COE tools is completely hidden.

3. **Actionable Tabbed Sub-Views**:
   - **Tab 1: Registration & Eligibility**: Cohort eligibility roster, clearance overrides, and student seat assignments.
   - **Tab 2: Integrity Report**: Human-centered integrity review queue with non-punitive wording ("Session Variance Flagged for Faculty Verification" instead of "Cheating Detected").
   - **Tab 3: Grading Queue**: Side-by-side student subjective responses and AI rubric recommendations awaiting faculty ratification.
   - **Tab 4: Results & Grievances**: Published score roster and student revaluation tracking.

### Visual Identity & Theme

- **Color Discipline (60-30-10)**:
  - *Dominant Canvas (60%)*: Crisp white (`#FFFFFF`) and slate canvas (`#F8FAFC`).
  - *Structural Surfaces (30%)*: Bordered panels (`border-slate-200`), table headers (`bg-slate-50`), and deep navy primary accents (`#0F172A` / `#1E293B`).
  - *Semantic Status Colors (10%)*:
    - **Green (`emerald-700 / emerald-50`)**: Passed, Eligible, Verified, Published.
    - **Amber (`amber-700 / amber-50`)**: Faculty Gate, Pending Review, Under Observation.
    - **Red (`rose-700 / rose-50`)**: Ineligible, Critical Flag, Overdue.
    - **Blue (`blue-700 / blue-50`)**: Ongoing, Info, Active Cohort.
  - *No Decorative Gradients*: Pure flat surfaces with 1px hairline borders (`border border-slate-200`).
- **Typography & Hierarchy**:
  - *Primary Sans*: Inter / Plus Jakarta Sans for crisp, legible UI labels.
  - *Monospace Outlier*: Tabular monospace (`font-mono tabular-nums`) strictly for Exam Codes, Timestamps, Scores, and Student IDs.
- **Top Bar Contract**:
  - Exactly 1 row: Single-line page title on left, Search input, Primary `"New Exam"` CTA button, Notification bell, and Profile menu on right.
  - Ask AI and System Operations moved to a slide-over side drawer.
  - Verified Environment pill removed.

---

## 3. Key Product Decisions & Trade-Offs

- **Role Partitioning at Layout Root**:
  - *Decision*: Conditional layout wrapper (`FacultyLayout` vs. `StudentLayout`) determined by `currentUser.role`.
  - *Why*: Prevents DOM pollution, accidental tab jumping, and guarantees students never see institutional authoring tools while faculty are not cluttered with student study hub tabs.
- **Exam Master Table over Grid Cards**:
  - *Decision*: Replace the multi-card exam grid with a compact, high-density table.
  - *Why*: Academic staff need to scan codes, durations, and passing thresholds simultaneously without layout clipping or truncated titles.
- **Demo Switcher Isolation**:
  - *Decision*: Placed in a subtle collapsible dock enabled strictly when `VITE_DEMO_MODE=true` (or via profile menu toggle).
  - *Why*: Removes administrative noise in production environments while maintaining effortless evaluation switching.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Root Application                              │
│         (Auth Session, Active User, Toasts, Fallback Detector)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│        COE / Faculty Layout           │ │        Student Layout        │
│ ┌───────────────────────────────────┐ │ │ ┌──────────────────────────┐ │
│ │ Top Bar: Title, Search, +New Exam │ │ │ │ Simplified Nav Header    │ │
│ │ Profile, Notifications, SidePanel │ │ │ │ Clearances Pill (Att/Fee)│ │
│ └───────────────────────────────────┘ │ │ └──────────────────────────┘ │
│ ┌───────────────────────────────────┐ │ │ ┌──────────────────────────┐ │
│ │ Persistent "SIMULATED" Banner     │ │ │ │ Persistent "SIMULATED"   │ │
│ └───────────────────────────────────┘ │ │ └──────────────────────────┘ │
│ ┌───────────────────────────────────┐ │ │ ┌──────────────────────────┐ │
│ │ "Needs Your Action" Metric Row    │ │ │ │ Student Views:           │ │
│ └───────────────────────────────────┘ │ │ │ • My Courses & Clearances│ │
│ ┌───────────────────────────────────┐ │ │ │ • Testing Hall / Practice │ │
│ │ Horizontal Lifecycle Stepper      │ │ │ │ • Scorecard & Review     │ │
│ └───────────────────────────────────┘ │ │ │ • Grievance Petitions    │ │
│ ┌───────────────────────────────────┐ │ │ └──────────────────────────┘ │
│ │ 4 Unified Tabs:                   │ │ └──────────────────────────────┘
│ │ • Registration & Eligibility      │ │
│ │ • Integrity Report (Non-punitive) │ │
│ │ • Grading Queue (Faculty Gate)    │ │
│ │ • Results & Grievances            │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Exam Master Table (Untruncated)   │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Component & State Mapping

- **`src/components/layout/Header.tsx`**:
  - Single-line title and breadcrumbs.
  - Inline search bar with debounce.
  - Single primary button: `+ New Exam` (opens Exam Configurator).
  - Notification icon with unread count.
  - Overflow drawer trigger for `System Operations` and `Gemini Academic AI`.
  - Accessible user profile trigger.
- **`src/components/faculty/FacultyDashboard.tsx`**:
  - "Needs your action" row: 4 interactive cards with live counts linking to their specific tabs.
  - 7-stage lifecycle stepper with interactive click-to-filter.
  - 4 major tabs: Registration & Eligibility, Integrity Report, Grading Queue, Results & Grievances.
  - Full-width Exam Master Table with tooltips, monospace marks, and contextual row actions (Summary PDF, Inspect, Grade).
- **`src/components/layout/Sidebar.tsx`**:
  - Cleaned up: COE/Faculty items strictly; no Student Portal tabs.
- **`src/components/layout/StudentHeader.tsx` & Student Portal**:
  - Dedicated streamlined layout for students.
- **`src/components/layout/DemoProfileDrawer.tsx`**:
  - Renders only when `VITE_DEMO_MODE=true` to switch personas safely.
- **`src/components/layout/FallbackDataBanner.tsx`**:
  - Persistent, dismissible top banner signaling simulated academic records.

### Verification Steps

- `npm run compile_applet` to verify TypeScript and JSX syntax across all updated components.
- Validate responsiveness across 1440px desktop, tablet, and mobile.
- Verify WCAG AA color contrast on navy, slate, and semantic status chips.
