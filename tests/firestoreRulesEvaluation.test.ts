import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Static Invariant Suite (Phase 1)', () => {
  const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf-8');

  it('R-01: Removes open /test/{testId} collection completely', () => {
    expect(rulesContent).not.toContain('/test/{testId}');
    expect(rulesContent).not.toContain('allow read, write: if true;');
  });

  it('R-02: Forbids student from modifying role or academic credentials in /users', () => {
    // Must contain diff affectedKeys check excluding role, feeCleared, attendanceRate, prerequisitesCleared
    expect(rulesContent).toContain("affectedKeys().hasAny(['role', 'feeCleared', 'attendanceRate', 'prerequisitesCleared'");
  });

  it('R-03: Eliminates email regex role inference and hardcoded admin email', () => {
    expect(rulesContent).not.toContain('uvikasbadiger@gmail.com');
    expect(rulesContent).not.toContain("request.auth.token.email.matches('.*faculty.*')");
    expect(rulesContent).not.toContain("request.auth.token.email.matches('.*admin.*')");
    expect(rulesContent).not.toContain("request.auth.token.email.matches('.*coe.*')");
    // Roles must strictly come from custom claims
    expect(rulesContent).toContain('request.auth.token.role');
  });

  it('R-04: Eliminates || true from submissions collection', () => {
    expect(rulesContent).not.toContain('|| true');
  });

  it('R-05: Submissions enforces immutability on score and faculty approvals for students', () => {
    expect(rulesContent).toContain("!request.resource.data.keys().hasAny(['score', 'totalScore', 'facultyApproved'");
    expect(rulesContent).toContain("affectedKeys().hasOnly(['responses', 'lastSavedAt', 'currentQuestionIndex', 'status'])");
  });

  it('R-06: Integrity logs are strictly append-only (no update, no delete)', () => {
    // In match /integrity_logs/{logId}:
    const integritySection = rulesContent.slice(rulesContent.indexOf('match /integrity_logs/{logId}'));
    expect(integritySection).toContain('allow update: if false;');
    expect(integritySection).toContain('allow delete: if false;');
    expect(integritySection).toContain('request.resource.data.autoPenaltyApplied == false');
  });

  it('R-07: Grievances cannot be updated or resolved by students', () => {
    const grievanceSection = rulesContent.slice(rulesContent.indexOf('match /grievances/{grievanceId}'));
    expect(grievanceSection).toContain('allow update: if isFaculty();');
  });

  it('R-08: Question bank is restricted to faculty only', () => {
    const questionSection = rulesContent.slice(rulesContent.indexOf('match /questions/{questionId}'));
    expect(questionSection).toContain('allow read, write: if isFaculty();');
  });
});
