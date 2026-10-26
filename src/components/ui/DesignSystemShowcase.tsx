import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { StatusChip } from './StatusChip.tsx';
import { Card } from './Card.tsx';
import { StatCard } from './StatCard.tsx';
import { DataTable, type Column } from './DataTable.tsx';
import { Tabs } from './Tabs.tsx';
import { Stepper, type StepItem } from './Stepper.tsx';
import { Timer } from './Timer.tsx';
import { QuestionPalette, type QuestionStatusItem } from './QuestionPalette.tsx';
import { ProctorTile } from './ProctorTile.tsx';
import { Dialog } from './Dialog.tsx';
import { Banner } from './Banner.tsx';
import { EmptyState } from './EmptyState.tsx';
import { FormField } from './FormField.tsx';
import { FileUpload } from './FileUpload.tsx';
import { Avatar } from './Avatar.tsx';
import { Breadcrumb } from './Breadcrumb.tsx';
import { ProgressBar } from './ProgressBar.tsx';
import { Timeline } from './Timeline.tsx';
import { showToast } from '../../utils/toast.ts';
import {
  FileText,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SampleRecord {
  id: string;
  code: string;
  title: string;
  duration: string;
  marks: number;
  status: 'published' | 'draft' | 'in_review';
}

const SAMPLE_DATA: SampleRecord[] = [
  {
    id: 'exam-1',
    code: 'CS-301',
    title: 'Distributed Systems & Cloud Computing Final Exam',
    duration: '180 min',
    marks: 100,
    status: 'published',
  },
  {
    id: 'exam-2',
    code: 'AI-204',
    title: 'Machine Learning Algorithms & Pattern Recognition',
    duration: '120 min',
    marks: 75,
    status: 'in_review',
  },
  {
    id: 'exam-3',
    code: 'EC-402',
    title: 'Embedded Systems & Real-Time Kernels Test',
    duration: '90 min',
    marks: 50,
    status: 'draft',
  },
];

export const DesignSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStep, setActiveStep] = useState(4); // Faculty review
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(2);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Stepper items conforming to university examination lifecycle
  const lifecycleSteps: StepItem[] = [
    { id: 'eligibility', label: 'Eligibility', count: 184 },
    { id: 'delivery', label: 'Delivery', count: 182 },
    { id: 'integrity_auto', label: 'Integrity & Auto-grade', count: 179 },
    { id: 'subjective', label: 'Subjective Grading', count: 179 },
    { id: 'faculty_review', label: 'Faculty Review', count: 14, isHumanGate: true },
    { id: 'publish', label: 'Publish', count: 165 },
    { id: 'grievances', label: 'Grievances', count: 3 },
  ];

  // Palette demo items
  const sampleQuestions: QuestionStatusItem[] = [
    { id: 1, number: 1, state: 'answered' },
    { id: 2, number: 2, state: 'answered' },
    { id: 3, number: 3, state: 'current' },
    { id: 4, number: 4, state: 'marked' },
    { id: 5, number: 5, state: 'not_answered' },
    { id: 6, number: 6, state: 'not_visited' },
    { id: 7, number: 7, state: 'answered' },
    { id: 8, number: 8, state: 'not_visited' },
    { id: 9, number: 9, state: 'not_visited' },
    { id: 10, number: 10, state: 'not_visited' },
  ];

  const columns: Column<SampleRecord>[] = [
    {
      key: 'code',
      header: 'Course Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums font-semibold text-[#1F4D3F]">{row.code}</span>
      ),
      width: '120px',
    },
    {
      key: 'title',
      header: 'Exam Title',
      sortable: true,
      render: (row) => (
        <div className="font-medium text-[#10251F]">
          <span>{row.title}</span>
          <span className="text-[11px] text-[#5B6B66] block">Pass: 40 marks</span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => <span className="font-mono tabular-nums text-[#5B6B66]">{row.duration}</span>,
      width: '110px',
    },
    {
      key: 'marks',
      header: 'Total Marks',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono tabular-nums font-bold">{row.marks}</span>,
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => {
        if (row.status === 'published') return <StatusChip status="success" label="Published" />;
        if (row.status === 'in_review') return <StatusChip status="warning" label="Faculty Review" />;
        return <StatusChip status="neutral" label="Draft" />;
      },
      width: '140px',
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner Demo */}
      <Banner
        variant="demo"
        message="DEMO DATA"
        subtext="Institutional Design System Reference for KLE Technological University Online Exam Portal"
      />

      {/* Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3EAE6] pb-5">
        <div>
          <Breadcrumb
            items={[
              { label: 'KLE Tech Portal' },
              { label: 'Design System', isCurrent: true },
            ]}
          />
          <h1 className="text-2xl lg:text-3xl font-bold text-[#10251F] mt-1 tracking-tight">
            Design System & Shared Components (Prompt 0)
          </h1>
          <p className="text-xs md:text-sm text-[#5B6B66] mt-0.5">
            Calm, institutional design tokens: deep green (<span className="font-mono text-[#1F4D3F] font-semibold">#1F4D3F</span>), mint tint (<span className="font-mono text-[#1F4D3F] font-semibold">#D6EBDD</span>), soft cream-green background (<span className="font-mono text-[#5B6B66]">#F6F9F6</span>), and amber action gate (<span className="font-mono text-[#B45309]">#B45309</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => showToast('Design System specification loaded successfully', 'info')}>
            Test Toast
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(true)}>
            Open Dialog Demo
          </Button>
        </div>
      </div>

      {/* Section 1: Color Tokens & Typography */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          1. Color Palette Tokens & Accessibility (WCAG AA &gt;= 4.5:1)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-[#1F4D3F] text-white p-3 rounded-[12px] shadow-xs">
            <span className="text-xs font-semibold block">Primary Deep Green</span>
            <span className="text-[11px] font-mono block opacity-90">#1F4D3F</span>
            <span className="text-[10px] block mt-2 opacity-80">Buttons, Active Nav</span>
          </div>

          <div className="bg-[#D6EBDD] text-[#1F4D3F] p-3 rounded-[12px] border border-[#1F4D3F]/20">
            <span className="text-xs font-semibold block">Primary Tint Mint</span>
            <span className="text-[11px] font-mono block">#D6EBDD</span>
            <span className="text-[10px] block mt-2 opacity-80">Answered, Selected</span>
          </div>

          <div className="bg-white text-[#10251F] p-3 rounded-[12px] border border-[#E3EAE6] shadow-xs">
            <span className="text-xs font-semibold block">Surface Card</span>
            <span className="text-[11px] font-mono text-[#5B6B66] block">#FFFFFF</span>
            <span className="text-[10px] text-[#5B6B66] block mt-2">16px Radius, 1px Border</span>
          </div>

          <div className="bg-[#F6F9F6] text-[#10251F] p-3 rounded-[12px] border border-[#E3EAE6]">
            <span className="text-xs font-semibold block">Background</span>
            <span className="text-[11px] font-mono text-[#5B6B66] block">#F6F9F6</span>
            <span className="text-[10px] text-[#5B6B66] block mt-2">Soft Cream-Green</span>
          </div>

          <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-[12px] border border-[#FDE68A]">
            <span className="text-xs font-semibold block">Amber / Warning</span>
            <span className="text-[11px] font-mono block">#B45309</span>
            <span className="text-[10px] block mt-2 opacity-80">Action Needed, Review</span>
          </div>

          <div className="bg-[#DCFCE7] text-[#15803D] p-3 rounded-[12px] border border-[#BBF7D0]">
            <span className="text-xs font-semibold block">Success Green</span>
            <span className="text-[11px] font-mono block">#15803D</span>
            <span className="text-[10px] block mt-2 opacity-80">Approved, Pass</span>
          </div>
        </div>
      </section>

      {/* Section 2: Shared Buttons & Status Chips */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          2. Button Hierarchy (Max 1 Primary Green Per Screen) & Status Chips
        </h2>
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="danger">Destructive Action</Button>
            <Button variant="primary" disabled>Disabled State</Button>
          </div>

          <div className="pt-4 border-t border-[#E3EAE6] flex flex-wrap items-center gap-2">
            <StatusChip status="success" label="Pass / Approved" />
            <StatusChip status="warning" label="Faculty Review Required" />
            <StatusChip status="danger" label="Verification Failed" />
            <StatusChip status="info" label="Proctored Session" />
            <StatusChip status="answered" label="Answered (8)" />
            <StatusChip status="marked" label="Marked for Review" />
            <StatusChip status="neutral" label="Scheduled" />
          </div>
        </Card>
      </section>

      {/* Section 3: Needs Your Action & Stat Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          3. &quot;Needs Your Action&quot; Institutional Row &amp; StatCards
        </h2>
        <div className="bg-white rounded-[16px] border border-[#E3EAE6] p-4 shadow-[0_1px_2px_rgba(16,37,31,0.06)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E3EAE6]">
            <div className="p-4">
              <span className="text-xs text-[#5B6B66] font-medium block">Ambiguous Eligibility</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#B45309]">4</span>
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              </div>
              <button className="text-xs text-[#1F4D3F] hover:underline font-medium mt-2 flex items-center gap-1 cursor-pointer">
                Review roster <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4">
              <span className="text-xs text-[#5B6B66] font-medium block">Integrity Flags to Review</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#B45309]">2</span>
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              </div>
              <button className="text-xs text-[#1F4D3F] hover:underline font-medium mt-2 flex items-center gap-1 cursor-pointer">
                Open integrity report <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4">
              <span className="text-xs text-[#5B6B66] font-medium block">Grading Drafts to Approve</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#B45309]">14</span>
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              </div>
              <button className="text-xs text-[#1F4D3F] hover:underline font-medium mt-2 flex items-center gap-1 cursor-pointer">
                Approve drafts <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4">
              <span className="text-xs text-[#5B6B66] font-medium block">Open Grievances</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-[#10251F]">0</span>
              </div>
              <button className="text-xs text-[#5B6B66] hover:text-[#10251F] font-medium mt-2 flex items-center gap-1 cursor-pointer">
                All resolved <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Stepper & Underline Tabs */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          4. Horizontal Lifecycle Stepper &amp; Underline Tabs
        </h2>
        <Card className="space-y-6">
          <Stepper
            steps={lifecycleSteps}
            activeStepIndex={activeStep}
            onSelectStep={setActiveStep}
          />

          <Tabs
            tabs={[
              { id: 'overview', label: 'All Exams', count: 12 },
              { id: 'roster', label: 'Registration & Eligibility', count: 4, actionNeeded: true },
              { id: 'integrity', label: 'Integrity Report', count: 2, actionNeeded: true },
              { id: 'grading', label: 'Grading Queue', count: 14, actionNeeded: true },
              { id: 'grievances', label: 'Results & Grievances', count: 0 },
            ]}
            activeTabId={activeTab}
            onSelectTab={setActiveTab}
          />
        </Card>
      </section>

      {/* Section 5: Student Exam Experience Primitives */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          5. Exam Runner Primitives (Timer, ProctorTile, QuestionPalette)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Timers in all 3 states */}
          <Card className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6B66]">
              Timer States
            </h3>
            <div className="space-y-2">
              <Timer secondsRemaining={1800} label="Nominal (>10m)" />
              <div className="block">
                <Timer secondsRemaining={480} label="Warning (<10m)" />
              </div>
              <div className="block">
                <Timer secondsRemaining={95} label="Critical (<2m)" />
              </div>
            </div>
          </Card>

          {/* Proctor Tile */}
          <Card className="flex flex-col items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6B66] mb-3 self-start">
              Proctoring Tile
            </h3>
            <ProctorTile
              isActive={true}
              isFullscreen={true}
              candidateName="Anita Rao (01FE21CS042)"
            />
          </Card>

          {/* Question Palette */}
          <div>
            <QuestionPalette
              questions={sampleQuestions}
              currentIndex={selectedQuestionIndex}
              onSelectQuestion={setSelectedQuestionIndex}
            />
          </div>
        </div>
      </section>

      {/* Section 6: DataTable & Form Fields */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          6. High-Density DataTable &amp; Input Controls
        </h2>
        <DataTable
          columns={columns}
          data={SAMPLE_DATA}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search exams by code or title..."
          searchField={(r) => `${r.code} ${r.title}`}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => showToast(`Opening ${row.code}`, 'info')}>
                View
              </Button>
            </div>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6B66]">
              Form Controls
            </h3>
            <FormField label="Course Code" required helperText="e.g. CS-301">
              <input
                type="text"
                defaultValue="CS-301"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E3EAE6] rounded-[10px] text-[#10251F] font-mono focus:outline-none focus:ring-2 focus:ring-[#1F4D3F]"
              />
            </FormField>

            <FormField label="Late Entry Cutoff" helperText="Minutes after start">
              <select className="w-full px-3 py-2 text-sm bg-white border border-[#E3EAE6] rounded-[10px] text-[#10251F] focus:outline-none focus:ring-2 focus:ring-[#1F4D3F]">
                <option value="15">15 minutes (Standard)</option>
                <option value="30">30 minutes</option>
                <option value="0">Strict (No late entry)</option>
              </select>
            </FormField>

            <ProgressBar value={78} label="Grading completion" subtext="78 / 100 papers" />
          </Card>

          <Card className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6B66]">
              File Upload &amp; User Avatar
            </h3>
            <FileUpload
              label="Upload Question Paper (.docx or .pdf)"
              helperText="Institutional syllabus or rubric up to 10MB"
              selectedFile={uploadedFile}
              onFileSelected={setUploadedFile}
              onClear={() => setUploadedFile(null)}
            />

            <div className="flex items-center gap-3 pt-2">
              <Avatar name="Dr. Vance" size="lg" />
              <div>
                <p className="text-sm font-semibold text-[#10251F]">Dr. Vance Sterling</p>
                <p className="text-xs text-[#5B6B66]">Associate Professor · Dept of Computer Science</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 7: Audit & Grievance Timeline */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6B66]">
          7. Audit &amp; Grievance Decision Timeline
        </h2>
        <Card>
          <Timeline
            events={[
              {
                id: 'evt-1',
                timestamp: 'Today, 10:45 AM',
                title: 'Faculty Grade Approved',
                actor: 'Dr. Vance (Faculty)',
                description: 'Reviewed question 3 subjective draft; upheld 4/5 marks with rubric notation.',
                status: { type: 'success', label: 'Approved' },
              },
              {
                id: 'evt-2',
                timestamp: 'Today, 09:12 AM',
                title: 'Integrity Signal Logged',
                actor: 'Proctoring System',
                description: 'Candidate switched tabs for 6 seconds during Section B. Non-punitive flag filed for faculty review.',
                status: { type: 'warning', label: 'Needs Review' },
                highlight: true,
              },
              {
                id: 'evt-3',
                timestamp: 'Yesterday, 04:30 PM',
                title: 'Exam Submission Confirmed',
                actor: 'Anita Rao (Student)',
                description: 'Submitted CS-301 Distributed Systems exam with receipt ID #REC-8842.',
                status: { type: 'neutral', label: 'Submitted' },
              },
            ]}
          />
        </Card>
      </section>

      {/* Interactive Confirm Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Confirm Exam Submission"
        description="Are you sure you want to finalize this action?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDialogOpen(false);
                showToast('Exam submission confirmed and receipt generated', 'success');
              }}
            >
              Confirm Submission
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#5B6B66]">
          <p className="text-[#10251F] font-medium">
            Once submitted, your answers will be locked for faculty evaluation.
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#F6F9F6] rounded-[10px] border border-[#E3EAE6] font-mono tabular-nums text-xs">
            <div>Answered: <strong className="text-[#1F4D3F]">18</strong></div>
            <div>Not answered: <strong>2</strong></div>
            <div>Marked for review: <strong className="text-[#B45309]">1</strong></div>
            <div>Time remaining: <strong>14:22</strong></div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
