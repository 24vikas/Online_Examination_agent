import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  ShieldCheck,
  CheckCircle2,
  Send,
} from 'lucide-react';
import type { Exam, Question, ExamSubmission, UserProfile } from '../../types/exam.ts';
import { INITIAL_QUESTIONS } from '../../firebase/seedData.ts';
import { getExamQuestions, saveSubmission } from '../../firebase/services.ts';
import { showToast } from '../../utils/toast.ts';
import { StatusChip } from '../ui/StatusChip.tsx';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';

interface PracticeTestsProps {
  practiceExams: Exam[];
  onStartPracticeExam?: (exam: Exam) => void;
  currentUser?: UserProfile;
  onSubmissionComplete?: (sub: ExamSubmission) => void;
}

export const PracticeTests: React.FC<PracticeTestsProps> = ({
  practiceExams,
  onStartPracticeExam,
  currentUser,
  onSubmissionComplete,
}) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // Synchronized countdown timer
  useEffect(() => {
    if (!activeExam || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExam, submitted, questions, selectedAnswers]);

  const startTest = async (exam: Exam) => {
    setActiveExam(exam);
    setTimeLeft((exam.durationMinutes || 30) * 60);
    setIsLoadingQuestions(true);

    try {
      // Fetch attached questions from exams/{examId}/questions
      const qs = await getExamQuestions(exam.id);
      if (qs && qs.length > 0) {
        setQuestions(qs);
      } else {
        const fallback =
          INITIAL_QUESTIONS[exam.id] ||
          INITIAL_QUESTIONS.exam_practice_algorithms ||
          INITIAL_QUESTIONS.exam_cs301_distributed ||
          [];
        setQuestions(fallback);
      }
    } catch (err) {
      console.warn('Error fetching exam questions:', err);
      const fallback =
        INITIAL_QUESTIONS[exam.id] ||
        INITIAL_QUESTIONS.exam_practice_algorithms ||
        INITIAL_QUESTIONS.exam_cs301_distributed ||
        [];
      setQuestions(fallback);
    } finally {
      setIsLoadingQuestions(false);
    }

    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const handleSelect = (qId: string, opt: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = async () => {
    if (!activeExam) return;
    let earned = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        earned += q.suggestedMarks;
      }
    });
    setScore(earned);
    setSubmitted(true);

    const submissionId = `sub_${currentUser?.id || 'stu'}_${Date.now()}`;
    const newSubmission: ExamSubmission = {
      id: submissionId,
      examId: activeExam.id,
      examTitle: activeExam.title,
      studentId: currentUser?.id || 'stu_alex_rivera',
      studentName: currentUser?.displayName || 'Alex Rivera',
      studentEmail: currentUser?.email || 'alex.rivera@student.university.edu',
      answers: selectedAnswers,
      timestamp: new Date().toISOString(),
      startedAt: new Date(Date.now() - (activeExam.durationMinutes * 60 - timeLeft) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      objectiveScore: earned,
      subjectiveScore: 0,
      totalScore: earned,
      maxScore: totalPossible,
      isPassed: earned >= (activeExam.passingScore || Math.round(totalPossible * 0.4)),
      subjectiveEvaluations: {},
      facultyApproved: true,
      integrityScore: 100,
      integrityFlagCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveSubmission(newSubmission);
      if (onSubmissionComplete) {
        onSubmissionComplete(newSubmission);
      }
      showToast('Examination submitted successfully to university registry.', 'success');
    } catch (subErr) {
      console.warn('Submission save notice:', subErr);
    }
  };

  const totalPossible = questions.reduce((a, b) => a + (b.suggestedMarks || b.maxMarks || 5), 0) || 50;

  const minutesDisplay = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const secondsDisplay = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div id="practice-tests-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
            Curricular Examination & Assessment Hall
          </span>
          <h2 className="text-xl font-semibold text-[#0B2545] mt-1">Student Testing Hall (Active & Published Exams)</h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Access formal published exams granted by the Controller of Examinations and self-paced formative assessment sandboxes.
          </p>
        </div>

        {activeExam && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveExam(null)}
          >
            Switch examination
          </Button>
        )}
      </Card>

      {!activeExam ? (
        /* Catalog of published exams */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practiceExams.map((exam) => (
            <Card
              key={exam.id}
              className="p-6 hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-[#0F4C81] bg-[#E8F0F8] px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {exam.courseCode}
                  </span>
                  <StatusChip
                    status={exam.status === 'published' ? 'success' : 'info'}
                    label={exam.status === 'published' ? 'Published' : 'Practice Sandbox'}
                  />
                </div>
                <h3 className="text-sm font-semibold text-[#0B2545] mb-1">{exam.title}</h3>
                <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">{exam.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#475569] mt-3 pt-3 border-t border-[#E2E8F0]">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" /> {exam.durationMinutes || 45} mins
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Award className="w-3.5 h-3.5 text-[#64748B]" /> {exam.totalMarks || 50} marks
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Format: <strong className="capitalize text-[#0B2545]">{exam.type}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  id={`btn-launch-proctored-mock-${exam.id}`}
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (onStartPracticeExam) {
                      onStartPracticeExam(exam);
                    } else {
                      startTest(exam);
                    }
                  }}
                >
                  <Video className="w-4 h-4" />
                  <span>Launch proctored hall</span>
                </Button>
                <Button
                  id={`btn-launch-sandbox-${exam.id}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => startTest(exam)}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Interactive sandbox</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Active Distraction-Free Exam Form */
        <div className="space-y-6">
          {/* Active test banner with Countdown Timer */}
          <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-[#0F4C81]">{activeExam.courseCode}</span>
              <h3 className="text-base font-semibold text-[#0B2545]">{activeExam.title}</h3>
              <p className="text-xs text-[#475569] mt-0.5">
                Target passing score: {activeExam.passingScore || 25} / {totalPossible} marks
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!submitted && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <Clock className={`w-4 h-4 ${timeLeft < 120 ? 'text-[#B91C1C]' : timeLeft < 600 ? 'text-[#B45309]' : 'text-[#0F4C81]'}`} />
                  <span className="text-xs text-[#475569]">Time left:</span>
                  <span className={`text-sm font-mono font-bold ${timeLeft < 120 ? 'text-[#B91C1C]' : timeLeft < 600 ? 'text-[#B45309]' : 'text-[#0B2545]'}`}>
                    {minutesDisplay}:{secondsDisplay}
                  </span>
                </div>
              )}

              {submitted && (
                <div className="text-right">
                  <span className="text-xs text-[#475569]">Score earned: </span>
                  <span className="text-lg font-bold font-mono text-[#15803D]">
                    {score} / {totalPossible} marks ({Math.round((score / totalPossible) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </Card>

          {isLoadingQuestions ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-6 h-6 text-[#0F4C81] animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#475569] font-medium">Fetching attached questions from exam registry...</p>
            </Card>
          ) : (
            /* Question cards with instant evaluation */
            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <Card
                    key={q.id}
                    className="p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0B2545]">Question {qIdx + 1}</span>
                      <span className="text-xs text-[#64748B] font-mono">{q.suggestedMarks || q.maxMarks || 5} marks</span>
                    </div>

                    <p className="text-sm font-medium text-[#0B2545] leading-relaxed">{q.prompt}</p>

                    {/* Options (for MCQ) */}
                    {q.type === 'mcq' && (
                      <div className="space-y-2 pt-1">
                        {(q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt, oIdx) => {
                          const selected = userAns === opt;
                          const correct = q.correctAnswer === opt;

                          let optClass = 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0B2545] hover:bg-[#E8F0F8]/50';
                          if (submitted) {
                            if (correct) {
                              optClass = 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D] font-semibold';
                            } else if (selected && !correct) {
                              optClass = 'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C] font-medium line-through';
                            } else {
                              optClass = 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]';
                            }
                          } else if (selected) {
                            optClass = 'bg-[#E8F0F8] border-[#0F4C81] text-[#0B2545] font-semibold ring-1 ring-[#0F4C81]';
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={submitted}
                              onClick={() => handleSelect(q.id, opt)}
                              className={`w-full text-left p-3 rounded-lg text-xs border transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${optClass}`}
                            >
                              <span>{opt}</span>
                              {submitted && correct && (
                                <StatusChip status="success" label="Correct" withDot={false} />
                              )}
                              {submitted && selected && !correct && (
                                <StatusChip status="danger" label="Your Choice" withDot={false} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subjective text area */}
                    {q.type === 'subjective' && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          disabled={submitted}
                          value={userAns || ''}
                          onChange={(e) => handleSelect(q.id, e.target.value)}
                          placeholder="Type your comprehensive architectural synthesis or derivation response..."
                          className="w-full text-xs p-3.5 border border-[#E2E8F0] rounded-lg min-h-[100px] focus:outline-none focus:border-[#0F4C81] text-[#0B2545] bg-white"
                        />
                        {submitted && q.rubric && (
                          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#475569]">
                            <span className="font-semibold text-[#0B2545]">Grading rubric: </span>
                            {q.rubric}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation when submitted */}
                    {submitted && q.explanation && (
                      <div className="p-3.5 bg-[#E8F0F8] border border-[#CBD5E1] rounded-lg text-xs text-[#0F4C81] mt-2 space-y-1">
                        <strong className="block text-xs uppercase tracking-wider text-[#0F4C81]">
                          Pedagogical explanation:
                        </strong>
                        <p className="text-[#0B2545]">{q.explanation}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => startTest(activeExam)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset session</span>
            </Button>

            {!submitted ? (
              <Button
                variant="primary"
                size="sm"
                disabled={Object.keys(selectedAnswers).length === 0}
                onClick={handleSubmit}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit answers</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveExam(null)}
              >
                Finish & return to testing hall
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
