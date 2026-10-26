import { describe, it, expect, vi } from 'vitest';
import { requireRole, validateBody } from '../server/securityMiddleware.ts';
import { generateQuestionsSchema, gradeSubjectiveSchema, auraDispatchSchema } from '../server/schemas.ts';

describe('Security Middleware & RBAC Invariants', () => {
  it('requireRole blocks unauthorized roles with 403 Forbidden', () => {
    const middleware = requireRole(['FACULTY', 'COE_AUTHOR']);
    const req: any = {
      user: { uid: 'stu_123', role: 'STUDENT' },
      path: '/api/gemini/grade-subjective',
    };
    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
      })
    );
  });

  it('requireRole allows authorized faculty role through', () => {
    const middleware = requireRole(['FACULTY', 'COE_AUTHOR']);
    const req: any = {
      user: { uid: 'fac_123', role: 'FACULTY' },
      path: '/api/gemini/grade-subjective',
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validateBody rejects invalid payloads with 400 Bad Request', async () => {
    const middleware = validateBody(gradeSubjectiveSchema);
    const req: any = {
      body: {
        // missing required studentAnswer and questionPrompt
        maxMarks: 10,
      },
    };
    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json: vi.fn(),
    };
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('BAD_REQUEST'),
      })
    );
  });

  it('validateBody accepts and sanitizes valid AURA tool dispatch schemas', async () => {
    const middleware = validateBody(auraDispatchSchema);
    const req: any = {
      body: {
        functionName: 'verify_eligibility',
        args: {
          studentUid: 'stu_alex',
          courseCode: '25ECSC307',
          feesCleared: true,
          attendancePercentage: 88.5,
          prerequisitesCleared: true,
        },
      },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
