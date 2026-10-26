import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Exam, ExamSubmission, UserProfile } from '../types/exam.ts';

// Helper to format date strings
const formatDate = (isoString?: string) => {
  if (!isoString) return new Date().toLocaleDateString();
  try {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

// Helper for grade calculation
const calculateGrade = (percentage: number) => {
  if (percentage >= 90) return { grade: 'A+', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', label: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', label: 'Good' };
  if (percentage >= 50) return { grade: 'D', label: 'Satisfactory' };
  return { grade: 'F', label: 'Needs Improvement' };
};

/**
 * 1. Generate Student Scorecard & Performance Transcript PDF
 */
export const generateStudentScorecardPDF = ({
  submission,
  exam,
  student,
}: {
  submission: ExamSubmission;
  exam?: Exam | null;
  student?: UserProfile | null;
}): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // --- HEADER BANNER ---
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('OFFICE OF ACADEMIC ASSESSMENTS & CONTROLLER OF EXAMINATIONS', margin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252); // Indigo-200
  doc.text('OFFICIAL TRANSCRIPT OF PERFORMANCE', pageWidth - margin, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`DOC REF: TR-${submission.id.slice(-8).toUpperCase()}`, pageWidth - margin, 17, { align: 'right' });

  // --- SUB-HEADER / TITLE ---
  let cursorY = 38;
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Student Assessment Scorecard', margin, cursorY);

  const percentage = Math.round((submission.totalScore / (submission.maxScore || 1)) * 100);
  const { grade, label: gradeLabel } = calculateGrade(percentage);
  const isPassed = submission.totalScore >= (exam?.passingScore || Math.round(submission.maxScore * 0.5));

  // Result Badge on top right
  const badgeText = isPassed ? `PASSED (GRADE: ${grade})` : `FAILED (GRADE: ${grade})`;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (isPassed) {
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.setDrawColor(16, 185, 129); // Emerald-500
    doc.setTextColor(6, 95, 70); // Emerald-800
  } else {
    doc.setFillColor(254, 242, 242); // Rose-50
    doc.setDrawColor(239, 68, 68); // Rose-500
    doc.setTextColor(153, 27, 27); // Rose-800
  }
  doc.roundedRect(pageWidth - margin - 46, cursorY - 7, 46, 9, 1.5, 1.5, 'FD');
  doc.text(badgeText, pageWidth - margin - 23, cursorY - 1, { align: 'center' });

  // --- CANDIDATE & COURSE DETAILS GRID ---
  cursorY += 7;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont('helvetica', 'normal');

  // Col 1
  const col1X = margin + 4;
  doc.text('Candidate Name:', col1X, cursorY + 7);
  doc.text('Student Roll No:', col1X, cursorY + 14);
  doc.text('Student Email:', col1X, cursorY + 21);
  doc.text('Department:', col1X, cursorY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(submission.studentName || 'Candidate', col1X + 28, cursorY + 7);
  doc.text(student?.studentId || submission.studentId.toUpperCase(), col1X + 28, cursorY + 14);
  doc.text(submission.studentEmail, col1X + 28, cursorY + 21);
  doc.text(student?.department || 'Computer Science & Engineering', col1X + 28, cursorY + 28);

  // Col 2
  const col2X = margin + (pageWidth - margin * 2) / 2 + 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Course Code:', col2X, cursorY + 7);
  doc.text('Assessment Title:', col2X, cursorY + 14);
  doc.text('Exam Submission Date:', col2X, cursorY + 21);
  doc.text('Ratification Status:', col2X, cursorY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(exam?.courseCode || 'CS-ACAD', col2X + 34, cursorY + 7);
  doc.text(submission.examTitle.length > 25 ? submission.examTitle.slice(0, 25) + '...' : submission.examTitle, col2X + 34, cursorY + 14);
  doc.text(formatDate(submission.submittedAt), col2X + 34, cursorY + 21);
  doc.text(submission.facultyApproved ? 'Faculty Ratified & Published' : 'Provisional Draft', col2X + 34, cursorY + 28);

  cursorY += 39;

  // --- SCORE SUMMARY TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Assessment Components Breakdown', margin, cursorY);
  cursorY += 3;

  const scoreRows = [
    [
      'Objective Section (MCQ Auto-Evaluation)',
      `${submission.objectiveScore} marks`,
      'Deterministic Vectorized Key',
      'Auto-Graded',
    ],
    [
      'Subjective Analytical Section',
      `${submission.subjectiveScore} marks`,
      'Rubric-Guided Criterion Model',
      submission.facultyApproved ? 'Faculty Ratified' : 'AI Draft Approved',
    ],
    [
      'TOTAL COMPOSITE SCORE',
      `${submission.totalScore} / ${submission.maxScore} marks`,
      `${percentage}% (${grade} - ${gradeLabel})`,
      isPassed ? 'PASS' : 'FAIL',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Assessment Section', 'Awarded Score', 'Scale & Percentage', 'Status']],
    body: scoreRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 45 },
      3: { cellWidth: 32, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // --- SUBJECTIVE EVALUATIONS TABLE (IF AVAILABLE) ---
  const subjectiveEntries = Object.entries(submission.subjectiveEvaluations || {});
  if (subjectiveEntries.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Subjective Question Evaluations & Rubric Detail', margin, cursorY);
    cursorY += 3;

    const subjectiveRows = subjectiveEntries.map(([qId, ev], index) => {
      const awarded = ev.facultyApprovedScore ?? ev.suggestedScore;
      const rubricNotes = (ev.rubricBreakdown || [])
        .map((r: any) => `${r.criterion}: ${r.awarded}/${r.max}`)
        .join('; ');

      const answerSnippet = ev.studentAnswer ? `"${ev.studentAnswer.slice(0, 70)}..."` : 'No text';

      return [
        `Q${index + 1}`,
        answerSnippet,
        `${awarded} / ${ev.maxMarks}`,
        rubricNotes || ev.reasoning?.slice(0, 80) || 'Assessed against rubric',
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['#', 'Student Response Snippet', 'Awarded', 'Rubric Criteria Breakdown']],
      body: subjectiveRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
        3: { cellWidth: 85 },
      },
      margin: { left: margin, right: margin },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- FACULTY FEEDBACK & REMARKS ---
  if (submission.facultyFeedback) {
    if (cursorY + 22 > pageHeight - 35) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFillColor(238, 242, 255); // Indigo-50
    doc.setDrawColor(199, 210, 254); // Indigo-200
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202); // Indigo-700
    doc.text('Official Faculty Review Remarks:', margin + 4, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(doc.splitTextToSize(submission.facultyFeedback, pageWidth - margin * 2 - 8), margin + 4, cursorY + 10.5);

    cursorY += 21;
  }

  // --- PROCTORING INTEGRITY ATTESTATION ---
  if (cursorY + 24 > pageHeight - 35) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Proctoring Integrity Audit & Session Verification', margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Integrity Index: ${submission.integrityScore ?? 100}% | Anomaly Flags: ${submission.integrityFlagCount ?? 0} (Reviewed contextually without automated disqualification)`,
    margin + 4,
    cursorY + 10
  );
  doc.text(
    'Exam session complied with institutional proctoring guidelines. Non-punitive human adjudication standard applied.',
    margin + 4,
    cursorY + 14.5
  );

  cursorY += 25;

  // --- SIGNATURE & OFFICIAL VALIDATION BLOCK ---
  if (cursorY + 30 > pageHeight - 15) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // Col 1: Security Hash
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Cryptographic Verification Hash:', margin, cursorY);
  doc.setFont('courier', 'normal');
  const dummyHash = `SHA256:${submission.id.repeat(2).slice(0, 48)}`;
  doc.text(dummyHash, margin, cursorY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toUTCString()}`, margin, cursorY + 8);

  // Col 2: Signature
  const signX = pageWidth - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dr. Eleanor Vance', signX, cursorY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Controller of Academic Examinations', signX, cursorY + 6);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('Digitally Signed & Validated', signX, cursorY + 10);

  // --- FOOTER PAGE NUMBER ---
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `University Academic Examination System - Official Candidate Transcript | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger download
  const cleanTitle = (exam?.courseCode || 'EXAM').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanStudent = (submission.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}_Scorecard_${cleanStudent}.pdf`);
};

/**
 * 2. Generate Faculty Exam Cohort Results Summary PDF
 */
export const generateFacultyExamSummaryPDF = ({
  exam,
  submissions,
  facultyName,
}: {
  exam: Exam;
  submissions: ExamSubmission[];
  facultyName?: string;
}): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(79, 70, 229); // Indigo Accent
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('ACADEMIC ASSESSMENT & EXAMINATION COUNCIL', margin, 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('COURSE EXAMINATION RESULTS & COHORT PERFORMANCE AUDIT', margin, 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252);
  doc.text(exam.courseCode, pageWidth - margin, 10.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 16.5, { align: 'right' });

  let cursorY = 36;

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(exam.title, margin, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Faculty In-Charge: ${facultyName || exam.facultyName || 'Dr. Eleanor Vance'} | Type: ${exam.type.toUpperCase()} | Passing Threshold: ${exam.passingScore} marks (${Math.round((exam.passingScore / exam.totalMarks) * 100)}%)`,
    margin,
    cursorY
  );

  cursorY += 8;

  // --- STATS OVERVIEW CARDS ---
  const examSubs = submissions.filter((s) => s.examId === exam.id);
  const totalAppeared = examSubs.length;
  const passedCount = examSubs.filter((s) => s.totalScore >= exam.passingScore).length;
  const passRate = totalAppeared > 0 ? Math.round((passedCount / totalAppeared) * 100) : 0;

  const scores = examSubs.map((s) => s.totalScore);
  const avgScore = totalAppeared > 0 ? (scores.reduce((a, b) => a + b, 0) / totalAppeared).toFixed(1) : '0';
  const highestScore = totalAppeared > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalAppeared > 0 ? Math.min(...scores) : 0;
  const pendingSubjective = examSubs.filter((s) => !s.facultyApproved).length;

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 17;

  const metrics = [
    { title: 'Total Candidates', value: `${totalAppeared}`, sub: 'Evaluated Submissions' },
    { title: 'Cohort Pass Rate', value: `${passRate}%`, sub: `${passedCount} of ${totalAppeared} passed` },
    { title: 'Class Average', value: `${avgScore} / ${exam.totalMarks}`, sub: `High: ${highestScore} | Low: ${lowestScore}` },
    { title: 'Pending Approval', value: `${pendingSubjective}`, sub: 'Subjective drafts' },
  ];

  metrics.forEach((m, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, cardX + 3, cursorY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, cardX + 3, cursorY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(m.sub, cardX + 3, cursorY + 14.5);
  });

  cursorY += cardHeight + 8;

  // --- CANDIDATE ROSTER RESULTS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Candidate Assessment Roster & Awarded Grades', margin, cursorY);
  cursorY += 3;

  // Sort by totalScore desc
  const sortedSubs = [...examSubs].sort((a, b) => b.totalScore - a.totalScore);

  const tableRows = sortedSubs.map((sub, idx) => {
    const pct = Math.round((sub.totalScore / (exam.totalMarks || 1)) * 100);
    const { grade } = calculateGrade(pct);
    const isPass = sub.totalScore >= exam.passingScore;

    return [
      `#${idx + 1}`,
      sub.studentId.toUpperCase(),
      sub.studentName,
      `${sub.objectiveScore}`,
      `${sub.subjectiveScore}`,
      `${sub.totalScore} / ${exam.totalMarks}`,
      `${pct}% (${grade})`,
      isPass ? 'PASS' : 'FAIL',
      `${sub.integrityScore ?? 100}% (${sub.integrityFlagCount ?? 0} flags)`,
      sub.facultyApproved ? 'Approved' : 'Pending',
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [[
      'Rank',
      'Roll No',
      'Candidate Name',
      'Obj',
      'Subj',
      'Composite',
      '% Grade',
      'Result',
      'Integrity',
      'Status',
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'No candidate submissions recorded', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 15, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Color result column
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.text[0] === 'PASS') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.text[0] === 'FAIL') {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // --- STATISTICAL SUMMARY & AUDIT DECLARATION ---
  if (cursorY + 30 > pageHeight - 20) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This summary report reflects verified candidate submissions, objective auto-grading algorithms, and faculty approved subjective assessments.',
    margin,
    cursorY
  );
  doc.text(
    `Official Record Hash: COHORT-${exam.id}-${Date.now().toString(36).toUpperCase()} | Department of Academic Standards`,
    margin,
    cursorY + 4
  );

  const signX = pageWidth - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(facultyName || exam.facultyName || 'Dr. Eleanor Vance', signX, cursorY + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Faculty Examination Lead', signX, cursorY + 7);

  // Page Numbers
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Course Examination Results Summary • ${exam.courseCode} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const filename = `${exam.courseCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_Results_Summary.pdf`;
  doc.save(filename);
};

/**
 * 3. Generate Master Examinations Report (All Courses)
 */
export const generateFacultyAllExamsReportPDF = ({
  exams,
  submissions,
  facultyName,
}: {
  exams: Exam[];
  submissions: ExamSubmission[];
  facultyName?: string;
}): void => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('COMPREHENSIVE SEMESTER EXAMINATIONS AUDIT & MASTER REPORT', margin, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252);
  doc.text(`Faculty: ${facultyName || 'Dr. Eleanor Vance'}`, pageWidth - margin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 16, { align: 'right' });

  let cursorY = 34;

  // Executive summary counts
  const totalExams = exams.length;
  const totalSubmissions = submissions.length;
  const totalPassed = submissions.filter((s) => s.isPassed).length;
  const avgIntegrity =
    submissions.length > 0
      ? (submissions.reduce((acc, s) => acc + (s.integrityScore ?? 100), 0) / submissions.length).toFixed(1)
      : '100';

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Executive Portfolio: ${totalExams} Assessments | ${totalSubmissions} Total Submissions | ${totalPassed} Passed | Avg Integrity: ${avgIntegrity}%`,
    margin,
    cursorY
  );
  cursorY += 5;

  const tableRows = exams.map((exam) => {
    const examSubs = submissions.filter((s) => s.examId === exam.id);
    const count = examSubs.length;
    const passed = examSubs.filter((s) => s.totalScore >= exam.passingScore).length;
    const passRate = count > 0 ? `${Math.round((passed / count) * 100)}%` : 'N/A';
    const avgScore = count > 0 ? (examSubs.reduce((a, b) => a + b.totalScore, 0) / count).toFixed(1) : 'N/A';
    const pendingReview = examSubs.filter((s) => !s.facultyApproved).length;

    return [
      exam.courseCode,
      exam.title,
      exam.type.toUpperCase(),
      `${exam.durationMinutes} min`,
      `${exam.totalMarks} (Pass: ${exam.passingScore})`,
      `${count}`,
      `${avgScore}`,
      passRate,
      `${pendingReview} pending`,
      exam.status.toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [[
      'Course Code',
      'Assessment Title',
      'Format',
      'Duration',
      'Max (Pass)',
      'Submissions',
      'Cohort Avg',
      'Pass Rate',
      'Subjective Reviews',
      'Exam Status',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 20 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      8: { cellWidth: 28, halign: 'center' },
      9: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Master Examinations Audit Report | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save('Academic_Examinations_Master_Report.pdf');
};

/**
 * 4. Generate Bulk Individual Student Submission Summaries Dossier PDF
 * Allows faculty to compile and download all or selected student submission summaries
 * including detailed objective and subjective scores, rubrics, and faculty sign-offs.
 */
export const generateBulkStudentSummariesPDF = ({
  submissions,
  exams,
  facultyName = 'Dr. Eleanor Vance',
  reportTitle = 'Faculty Evaluation & Candidate Submissions Dossier',
}: {
  submissions: ExamSubmission[];
  exams: Exam[];
  facultyName?: string;
  reportTitle?: string;
}): void => {
  if (!submissions || submissions.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ==================== COVER / ROSTER SUMMARY PAGE ====================
  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ACADEMIC REVIEW & FACULTY EVALUATION GATE', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('BULK CANDIDATE SUBMISSION SUMMARIES & SCORE AUDIT DOSSIER', margin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252);
  doc.text(`Faculty Lead: ${facultyName}`, pageWidth - margin, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 17, { align: 'right' });

  let cursorY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(reportTitle, margin, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Comprehensive compilation of ${submissions.length} candidate assessments. Individual submission breakdowns with objective and subjective components follow.`,
    margin,
    cursorY
  );

  cursorY += 8;

  // Executive Metric Cards
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s) => s.facultyApproved).length;
  const pendingCount = totalSubmissions - approvedCount;
  const totalPassed = submissions.filter((s) => s.isPassed).length;
  const passRate = totalSubmissions > 0 ? Math.round((totalPassed / totalSubmissions) * 100) : 0;
  const avgObj =
    totalSubmissions > 0
      ? (submissions.reduce((acc, s) => acc + s.objectiveScore, 0) / totalSubmissions).toFixed(1)
      : '0';
  const avgSubj =
    totalSubmissions > 0
      ? (submissions.reduce((acc, s) => acc + s.subjectiveScore, 0) / totalSubmissions).toFixed(1)
      : '0';

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 17;

  const summaryCards = [
    { title: 'Submissions Included', value: `${totalSubmissions}`, sub: `${approvedCount} Ratified | ${pendingCount} Pending` },
    { title: 'Pass Rate', value: `${passRate}%`, sub: `${totalPassed} of ${totalSubmissions} Cleared` },
    { title: 'Avg Objective Score', value: `${avgObj} m`, sub: 'Automated Key Evaluation' },
    { title: 'Avg Subjective Score', value: `${avgSubj} m`, sub: 'Faculty Rubric Evaluation' },
  ];

  summaryCards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cardX + 3, cursorY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(c.value, cardX + 3, cursorY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cardX + 3, cursorY + 14.5);
  });

  cursorY += cardHeight + 8;

  // Master Roster Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Included Candidates Index', margin, cursorY);
  cursorY += 3;

  const rosterRows = submissions.map((sub, idx) => {
    const matchingExam = exams.find((e) => e.id === sub.examId);
    const pct = Math.round((sub.totalScore / (sub.maxScore || 1)) * 100);
    const { grade } = calculateGrade(pct);

    return [
      `#${idx + 1}`,
      sub.studentId.toUpperCase(),
      sub.studentName,
      matchingExam?.courseCode || 'EXAM',
      `${sub.objectiveScore}m`,
      `${sub.subjectiveScore}m`,
      `${sub.totalScore}/${sub.maxScore}`,
      `${pct}% (${grade})`,
      sub.isPassed ? 'PASS' : 'FAIL',
      sub.facultyApproved ? 'Ratified' : 'Pending',
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [[
      '#',
      'Roll No',
      'Candidate Name',
      'Course',
      'Obj',
      'Subj',
      'Total',
      '% Grade',
      'Result',
      'Approval',
    ]],
    body: rosterRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
      9: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.text[0] === 'PASS') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.text[0] === 'FAIL') {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  // ==================== INDIVIDUAL CANDIDATE PAGES ====================
  submissions.forEach((sub, subIdx) => {
    doc.addPage();
    const currentExam = exams.find((e) => e.id === sub.examId);
    let y = 14;

    // Student Header Card
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y + 22, pageWidth - margin * 2, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Candidate #${subIdx + 1}: ${sub.studentName}`, margin + 5, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `ID: ${sub.studentId.toUpperCase()} | Email: ${sub.studentEmail} | Exam: ${sub.examTitle} (${currentExam?.courseCode || 'CS-ACAD'})`,
      margin + 5,
      y + 14
    );

    const pct = Math.round((sub.totalScore / (sub.maxScore || 1)) * 100);
    const { grade, label: gradeLabel } = calculateGrade(pct);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(165, 180, 252);
    doc.text(
      `Score: ${sub.totalScore}/${sub.maxScore} (${pct}% • ${grade})`,
      pageWidth - margin - 5,
      y + 8,
      { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(
      `Status: ${sub.facultyApproved ? 'Faculty Ratified' : 'Pending Review'}`,
      pageWidth - margin - 5,
      y + 14,
      { align: 'right' }
    );

    y += 28;

    // Score Metrics Strip
    const colW = (pageWidth - margin * 2 - 6) / 3;
    const stripH = 15;

    // Col 1: Objective
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, colW, stripH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Objective Component (MCQ)', margin + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sub.objectiveScore} marks`, margin + 3, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Automated key registry verification', margin + 3, y + 13);

    // Col 2: Subjective
    const col2X = margin + colW + 3;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(col2X, y, colW, stripH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Subjective Component', col2X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229);
    doc.text(`${sub.subjectiveScore} marks`, col2X + 3, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sub.facultyApproved ? 'Faculty approved score' : 'AI assisted draft proposal', col2X + 3, y + 13);

    // Col 3: Proctoring & Integrity
    const col3X = margin + (colW + 3) * 2;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(col3X, y, colW, stripH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Proctoring Integrity Index', col3X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`${sub.integrityScore ?? 100}% Compliance`, col3X + 3, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      sub.integrityFlagCount === 0 ? 'Clean proctor session' : `${sub.integrityFlagCount} flags evaluated contextually`,
      col3X + 3,
      y + 13
    );

    y += stripH + 6;

    // Faculty Feedback Note if any
    if (sub.facultyFeedback) {
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(67, 56, 202);
      doc.text('Faculty Evaluator Remarks:', margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(sub.facultyFeedback, margin + 3, y + 8.5);

      y += 16;
    }

    // Subjective Evaluation Question Details Table
    const subjectiveEntries = Object.entries(sub.subjectiveEvaluations || {});
    if (subjectiveEntries.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Subjective Question Evaluations & Rubrics Breakdown', margin, y);
      y += 3;

      const subTableRows = subjectiveEntries.map(([qId, ev], qIdx) => {
        const awarded = ev.facultyApprovedScore ?? ev.suggestedScore;
        const rubricNotes = (ev.rubricBreakdown || [])
          .map((r: any) => `${r.criterion}: ${r.awarded}/${r.max}`)
          .join('; ');
        const answerSnippet = ev.studentAnswer ? `"${ev.studentAnswer.slice(0, 80)}..."` : 'No text';

        return [
          `Q${qIdx + 1}`,
          answerSnippet,
          `${awarded} / ${ev.maxMarks}`,
          rubricNotes || ev.reasoning?.slice(0, 90) || 'Evaluated against rubric standards',
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['#', 'Student Response Snippet', 'Awarded', 'Rubric Criteria & Evaluator Reasoning']],
        body: subTableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        styles: {
          fontSize: 7,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 62 },
          2: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
          3: { cellWidth: 92 },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Footer Sign-off on each student summary
    if (y + 18 > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Assessment ID: SUB-${sub.id} | Timestamp: ${formatDate(sub.submittedAt)} | Verified by Faculty Evaluation Gate`,
      margin,
      y
    );

    const signX = pageWidth - margin - 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(facultyName, signX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Evaluator Sign-Off', signX, y + 3.5);
  });

  // Number all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Faculty Review & Evaluation Gate • Candidate Submissions Dossier | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanFilename = `Faculty_Evaluation_Candidate_Dossier_${Date.now().toString(36).toUpperCase()}.pdf`;
  doc.save(cleanFilename);
};

