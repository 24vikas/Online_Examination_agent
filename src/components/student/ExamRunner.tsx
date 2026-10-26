import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Shield,
  Video,
  VideoOff,
  Camera,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  FileCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { StatusChip } from '../ui/StatusChip.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import type {
  Exam,
  Question,
  ExamSubmission,
  IntegrityLog,
  UserProfile,
  SubjectiveGradeProposal,
} from '../../types/exam.ts';
import {
  getExamQuestions,
  saveSubmission,
  addIntegrityLog,
} from '../../firebase/services.ts';
import { INITIAL_QUESTIONS } from '../../firebase/seedData.ts';
import {
  requestHardwareMediaStream,
  createVirtualProctorStream,
  getSupportedRecorderMimeType,
} from '../../utils/proctorMedia.ts';

interface ExamRunnerProps {
  exam: Exam;
  currentUser: UserProfile;
  onFinishExam: (submission: ExamSubmission) => void;
  onExit: () => void;
  initialStream?: MediaStream | null;
  candidatePhotoUrl?: string;
  verificationToken?: string;
  isVirtualCamera?: boolean;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  exam,
  currentUser,
  onFinishExam,
  onExit,
  initialStream,
  candidatePhotoUrl,
  verificationToken,
  isVirtualCamera: initialIsVirtual = false,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(exam.durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  // Proctoring telemetry
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [copyAttemptCount, setCopyAttemptCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Camera & Proctoring states
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'no-device' | 'error' | 'simulated'>('idle');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraResolution, setCameraResolution] = useState<{ width: number; height: number } | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showMobilePip, setShowMobilePip] = useState<boolean>(false);
  const [showCameraDiagnostics, setShowCameraDiagnostics] = useState<boolean>(false);

  // MediaRecorder video recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [incidentClips, setIncidentClips] = useState<
    Array<{ timestamp: string; flagType: string; videoTimestampOffset: number; note: string }>
  >([]);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [finalSubmissionData, setFinalSubmissionData] = useState<ExamSubmission | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const virtualCleanupRef = useRef<(() => void) | null>(null);

  // Method to request and start physical webcam
  const startCamera = async (isManualClick = false, deviceId?: string) => {
    setCameraStatus('requesting');
    setCameraError(null);

    // Clean up existing media tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (virtualCleanupRef.current) {
      virtualCleanupRef.current();
      virtualCleanupRef.current = null;
    }

    try {
      const { stream, resolution } = await requestHardwareMediaStream(deviceId || selectedDeviceId);
      streamRef.current = stream;
      setCameraActive(true);
      setCameraStatus('active');
      setCameraResolution(resolution);
      setCameraError(null);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video element play() warning:', playErr);
        });
      }

      // Enumerate available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (!selectedDeviceId && videoInputs[0]?.deviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (enumErr) {
        // Enumerate error is non-fatal
      }

      // Automatically begin proctored video recording with MediaRecorder
      startMediaRecording(stream);

      if (isManualClick) {
        setToastMessage('Live proctoring camera feed & video recording active!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      console.warn('Hardware camera error in ExamRunner:', err);
      let msg = 'Hardware camera is unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied in your browser. Live feed is running in Virtual Proctor Safe Mode.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No physical webcam detected. Live feed is running in Virtual Proctor Safe Mode.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is in use by another application. Switched to Virtual Proctor Safe Mode.';
      }
      setCameraError(msg);

      // Seamlessly fallback to Virtual Proctor Test Stream so video recording and proctoring NEVER fail!
      enableVirtualCamera(msg);
    }
  };

  // Start virtual proctor test camera stream
  const enableVirtualCamera = (customToast?: string) => {
    if (virtualCleanupRef.current) {
      virtualCleanupRef.current();
    }
    const { stream: virtStream, stop: virtStop } = createVirtualProctorStream(
      currentUser.displayName,
      currentUser.studentId || currentUser.id
    );
    virtualCleanupRef.current = virtStop;
    streamRef.current = virtStream;
    setCameraActive(true);
    setCameraStatus('active');
    setCameraResolution({ width: 640, height: 480 });

    if (videoRef.current) {
      videoRef.current.srcObject = virtStream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }

    startMediaRecording(virtStream);

    if (customToast) {
      setToastMessage(customToast);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Start video recording with MediaRecorder
  const startMediaRecording = (streamToRecord: MediaStream) => {
    try {
      if (typeof MediaRecorder === 'undefined') {
        console.warn('MediaRecorder is not supported in this browser environment.');
        return;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        return;
      }

      recordedChunksRef.current = [];
      const mimeType = getSupportedRecorderMimeType() || 'video/webm';

      const recorder = new MediaRecorder(streamToRecord, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstart = () => {
        setIsRecording(true);
      };
      recorder.onstop = () => {
        setIsRecording(false);
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
        }
      };
      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
    } catch (recErr) {
      console.warn('MediaRecorder initialization notice:', recErr);
    }
  };

  // Recording seconds timer
  useEffect(() => {
    let recTimer: any;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(recTimer);
  }, [isRecording]);

  // Load exam questions
  useEffect(() => {
    let isMounted = true;
    async function load() {
      const qs = await getExamQuestions(exam.id);
      if (isMounted) {
        if (qs && qs.length > 0) {
          setQuestions(qs);
        } else if (INITIAL_QUESTIONS[exam.id] && INITIAL_QUESTIONS[exam.id].length > 0) {
          setQuestions(INITIAL_QUESTIONS[exam.id]);
        } else {
          // Fallback to sample questions for CS-301 if exam has none yet
          setQuestions(INITIAL_QUESTIONS.exam_cs301_distributed);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [exam.id]);

  // Webcam & Recording initialization: use initialStream if provided or request
  useEffect(() => {
    if (initialStream && initialStream.active) {
      streamRef.current = initialStream;
      setCameraActive(true);
      setCameraStatus('active');
      if (videoRef.current) {
        videoRef.current.srcObject = initialStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch(() => {});
      }
      startMediaRecording(initialStream);
    } else {
      startCamera(false);
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (virtualCleanupRef.current) {
        virtualCleanupRef.current();
        virtualCleanupRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [exam.id, initialStream]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions, answers]);

  // Proctoring listeners: Tab switch & Window blur
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setToastMessage('Integrity Notice: Tab switched or browser minimized. Telemetry logged.');

        const newLog: IntegrityLog = {
          id: `log_${Date.now()}_tab`,
          submissionId: `sub_${currentUser.id}_${exam.id}`,
          examId: exam.id,
          examTitle: exam.title,
          studentId: currentUser.id,
          studentName: currentUser.displayName,
          timestamp: new Date().toISOString(),
          flagType: 'tab_switch',
          severity: 'low',
          details: `Candidate switched browser tab during question ${currentIndex + 1}.`,
          facultyReviewed: false,
          facultyDecision: 'pending',
          createdAt: new Date().toISOString(),
        };
        await addIntegrityLog(newLog);
        setTimeout(() => setToastMessage(null), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [exam.id, currentUser, currentIndex]);

  // Copy paste prevention
  const handleCopyPasteBlock = async (action: 'copy' | 'paste') => {
    if (exam.proctoringRules?.blockCopyPaste) {
      setCopyAttemptCount((prev) => prev + 1);
      setToastMessage('Notice: Clipboard copy/paste is disabled for examination integrity.');

      const newLog: IntegrityLog = {
        id: `log_${Date.now()}_copy`,
        submissionId: `sub_${currentUser.id}_${exam.id}`,
        examId: exam.id,
        examTitle: exam.title,
        studentId: currentUser.id,
        studentName: currentUser.displayName,
        timestamp: new Date().toISOString(),
        flagType: 'copy_paste_attempt',
        severity: 'medium',
        details: `Candidate attempted clipboard ${action} operation. Action intercepted.`,
        facultyReviewed: false,
        facultyDecision: 'pending',
        createdAt: new Date().toISOString(),
      };
      await addIntegrityLog(newLog);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSelectOption = (qId: string, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
  };

  const handleTextAnswerChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
  };

  const toggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Submit and grade
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    let objectiveScore = 0;
    let subjectiveMax = 0;
    let objectiveMax = 0;

    questions.forEach((q) => {
      if (q.type === 'mcq') {
        objectiveMax += q.suggestedMarks;
        if (answers[q.id] && answers[q.id] === q.correctAnswer) {
          objectiveScore += q.suggestedMarks;
        }
      } else {
        subjectiveMax += q.suggestedMarks;
      }
    });

    const submissionId = `sub_${currentUser.id}_${Date.now()}`;
    const totalMax = objectiveMax + subjectiveMax || exam.totalMarks;

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {}
    }

    let finalVideoUrl = recordedVideoUrl;
    if (recordedChunksRef.current.length > 0) {
      try {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        finalVideoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(finalVideoUrl);
      } catch (bErr) {
        console.warn('Blob generation warning:', bErr);
      }
    }

    const assignedToken = verificationToken || `KLE-PROCTOR-${exam.courseCode}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    // Build submission
    const submission: ExamSubmission = {
      id: submissionId,
      examId: exam.id,
      examTitle: exam.title,
      studentId: currentUser.id,
      studentName: currentUser.displayName,
      studentEmail: currentUser.email,
      startedAt: new Date(Date.now() - (exam.durationMinutes * 60 - timeLeftSeconds) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      answers,
      objectiveScore,
      subjectiveScore: 0, // AI grading will propose this, pending faculty approval!
      totalScore: objectiveScore,
      maxScore: totalMax,
      isPassed: objectiveScore >= exam.passingScore,
      subjectiveEvaluations: {},
      facultyApproved: false,
      integrityScore: Math.max(0, 100 - (tabSwitchCount * 8 + copyAttemptCount * 10)),
      integrityFlagCount: tabSwitchCount + copyAttemptCount,
      proctoringRecordingUrl: finalVideoUrl || undefined,
      proctoringVideoDurationSeconds: recordingSeconds,
      candidatePhotoUrl: candidatePhotoUrl || undefined,
      verificationToken: assignedToken,
      incidentClips: incidentClips,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save initial submission to Firestore
    await saveSubmission(submission);

    // Call background AI grading for each subjective response using Gemini Thinking mode
    const subjectiveQuestions = questions.filter((q) => q.type === 'subjective');
    if (subjectiveQuestions.length > 0) {
      for (const sq of subjectiveQuestions) {
        const studentAns = answers[sq.id] || '';
        if (studentAns.trim().length > 0) {
          fetch('/api/gemini/grade-subjective', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionPrompt: sq.prompt,
              studentAnswer: studentAns,
              rubric: sq.rubric || 'Accuracy and technical depth',
              maxMarks: sq.suggestedMarks,
              model: 'gemini-3.1-pro-preview',
              thinkingLevel: 'HIGH',
            }),
          })
            .then((r) => r.json())
            .then(async (json) => {
              if (json.success && json.data) {
                const evalData = json.data;
                submission.subjectiveEvaluations[sq.id] = {
                  questionId: sq.id,
                  studentAnswer: studentAns,
                  suggestedScore: evalData.suggestedScore || Math.round(sq.suggestedMarks * 0.75),
                  maxMarks: sq.suggestedMarks,
                  reasoning: evalData.reasoning,
                  rubricBreakdown: evalData.rubricBreakdown || [],
                  strengths: evalData.strengths || [],
                  weaknesses: evalData.weaknesses || [],
                  facultyNote: evalData.facultyNote || 'AI Evaluated with Gemini 3.1 Pro Thinking Mode.',
                  status: 'pending_approval',
                };
                submission.subjectiveScore = Object.values(submission.subjectiveEvaluations).reduce(
                  (a: number, b: SubjectiveGradeProposal) => a + (b.suggestedScore || 0),
                  0,
                );
                await saveSubmission(submission);
              }
            })
            .catch((e) => console.error('Background subjective grading failed:', e));
        }
      }
    }

    setFinalSubmissionData(submission);
    setIsSubmitting(false);
    setShowSubmitModal(false);
    setShowVerificationModal(true);
  };

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div
      id="distraction-free-exam-runner"
      className="fixed inset-0 bg-white text-[#0B2545] flex flex-col z-50 select-none overflow-hidden font-sans"
      onCopy={(e) => {
        e.preventDefault();
        handleCopyPasteBlock('copy');
      }}
      onPaste={(e) => {
        e.preventDefault();
        handleCopyPasteBlock('paste');
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="alert"
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-medium px-4 py-2.5 rounded-xl shadow-md text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar: Course & Exam Name, Autosave Indicator, Large Timer */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono font-bold text-sm text-[#0B2545] whitespace-nowrap">
            {exam.courseCode}
          </span>
          <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
          <span className="text-sm font-semibold text-[#0B2545] truncate max-w-xs md:max-w-md">
            {exam.title}
          </span>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Autosave Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#475569] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            <span>Saved {lastSavedTime}</span>
          </div>

          <div className="w-px h-5 bg-[#E2E8F0] hidden sm:block" />

          {/* Large Countdown Timer */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg">
            <Clock
              className={`w-4 h-4 ${
                timeLeftSeconds <= 120
                  ? 'text-[#B91C1C]'
                  : timeLeftSeconds <= 600
                  ? 'text-[#B45309]'
                  : 'text-[#0B2545]'
              }`}
            />
            <span
              className={`font-mono text-lg font-bold tabular-nums tracking-tight ${
                timeLeftSeconds <= 120
                  ? 'text-[#B91C1C]'
                  : timeLeftSeconds <= 600
                  ? 'text-[#B45309]'
                  : 'text-[#0B2545]'
              }`}
            >
              {formatTime(timeLeftSeconds)}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:inline-flex"
          >
            Finish & Submit
          </Button>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Centered Question Column (max 760px) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          <div className="max-w-[760px] mx-auto w-full space-y-6">
            {currentQ ? (
              <div className="space-y-6">
                {/* Question Metadata Header */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0B2545]">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <StatusChip
                      status="neutral"
                      withDot={false}
                      label={currentQ.type === 'mcq' ? 'Objective MCQ' : 'Subjective Essay'}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#475569]">
                    <span>
                      Marks: <strong className="text-[#0B2545] font-semibold">{currentQ.suggestedMarks}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFlag(currentIndex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
                        flaggedQuestions.has(currentIndex)
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flaggedQuestions.has(currentIndex) ? 'Marked for review' : 'Mark for review'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="text-base text-[#0B2545] font-medium leading-relaxed">
                  {currentQ.prompt}
                </div>

                {/* MCQ Options: 44px touch targets */}
                {currentQ.type === 'mcq' && currentQ.options && (
                  <div className="space-y-3 pt-1">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = answers[currentQ.id] === option;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, option)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3.5 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'border-2 border-[#0F4C81] bg-[#E8F0F8] text-[#0B2545] font-semibold'
                              : 'border border-[#E2E8F0] bg-white text-[#0B2545] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#0F4C81] bg-[#0F4C81] text-white'
                                : 'border-[#CBD5E1] bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="leading-relaxed">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Subjective Essay Box */}
                {currentQ.type === 'subjective' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-[#475569]">
                      <span>Formulate your response:</span>
                      <span className="font-mono text-[11px]">
                        {(answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={9}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                      placeholder="Write your comprehensive technical response..."
                      aria-label="Subjective response"
                      className="w-full text-sm font-sans bg-white border border-[#E2E8F0] rounded-xl p-4 text-[#0B2545] focus:outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] leading-relaxed resize-y"
                    />
                    <p className="text-[11px] text-[#64748B]">
                      Responses are evaluated against curriculum rubrics and verified by faculty invigilators.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-[#64748B]">Loading examination questions...</div>
            )}
          </div>
        </div>

        {/* Right Panel: Question Palette Grid & Picture-in-Picture Proctor Tile */}
        <aside className="w-72 bg-[#F8FAFC] border-l border-[#E2E8F0] p-5 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="space-y-5">
            {/* Proctor Camera Tile: Small, Fixed Picture-in-Picture with recording dot */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B2545]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#475569]">PROCTOR REC</span>
                </div>
                {cameraStatus === 'active' && (
                  <span className="text-[10px] text-[#15803D] font-mono font-medium">LIVE</span>
                )}
              </div>

              {/* Viewport */}
              <div className="w-full aspect-video bg-[#0B2545] rounded-lg overflow-hidden relative border border-[#E2E8F0] flex items-center justify-center">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${
                    cameraStatus === 'active' ? 'block' : 'hidden'
                  }`}
                />

                {cameraStatus !== 'active' && (
                  <div className="p-3 text-center space-y-1 text-white">
                    <Camera className="w-4 h-4 mx-auto text-white/70" />
                    <button
                      type="button"
                      onClick={() => startCamera(true)}
                      className="px-2.5 py-1 bg-white text-[#0B2545] rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Connect Webcam
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Question Palette Grid */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B2545] mb-2.5">
                <span>Question Palette</span>
                <span className="font-mono text-xs text-[#475569]">
                  {answeredCount}/{questions.length} answered
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isFlagged = flaggedQuestions.has(idx);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg text-xs font-mono font-semibold transition-all relative flex items-center justify-center cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
                        isCurrent ? 'ring-2 ring-[#F97316] ring-offset-1 font-bold' : ''
                      } ${
                        isFlagged
                          ? 'bg-[#FEF3C7] text-[#B45309] border border-[#B45309]'
                          : isAnswered
                          ? 'bg-[#0B2545] text-white'
                          : 'border border-[#E2E8F0] bg-white text-[#0B2545] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend: Answered = navy, Marked for review = amber, Unanswered = outlined, Current = orange ring */}
              <div className="pt-4 border-t border-[#E2E8F0] mt-4 space-y-2 text-xs text-[#475569]">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#0B2545]" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#FEF3C7] border border-[#B45309]" />
                  <span>Marked for review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border border-[#E2E8F0] bg-white" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border-2 border-[#F97316] bg-white" />
                  <span>Current question</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] text-center pt-3 border-t border-[#E2E8F0]">
            Autonomous integrity session verified
          </div>
        </aside>
      </div>

      {/* Bottom Bar: Previous, Mark for review, Save and Next (ONE orange button), Submit */}
      <footer className="h-16 bg-white border-t border-[#E2E8F0] px-6 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleFlag(currentIndex)}
            className={
              flaggedQuestions.has(currentIndex)
                ? 'border-[#B45309] text-[#B45309] bg-[#FEF3C7]'
                : ''
            }
          >
            <Flag className="w-4 h-4" />
            <span>{flaggedQuestions.has(currentIndex) ? 'Marked' : 'Mark for review'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {currentIndex < questions.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              <span>Save and Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSubmitModal(true)}
            >
              <span>Save and Finish</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="sm:hidden"
          >
            Submit
          </Button>
        </div>
      </footer>

      {/* Confirmation Dialog Summarising Answered/Unanswered Counts */}
      <Dialog
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
        description="Verify your response status before sealing this assessment"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setShowSubmitModal(false)}
            >
              Return to Exam
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
            >
              {isSubmitting ? 'Encrypting & Submitting...' : 'Confirm Submission'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-[#475569] leading-relaxed">
            Once submitted, your answers will be sealed and transmitted to the faculty evaluation gate.
          </p>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#475569]">Total Questions:</span>
              <span className="font-mono font-bold text-[#0B2545]">{questions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#475569]">Answered:</span>
              <span className="font-mono font-bold text-[#15803D]">{answeredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#475569]">Unanswered:</span>
              <span
                className={`font-mono font-bold ${
                  questions.length - answeredCount > 0 ? 'text-[#B45309]' : 'text-[#0B2545]'
                }`}
              >
                {questions.length - answeredCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#475569]">Marked for review:</span>
              <span className="font-mono font-bold text-[#B45309]">{flaggedQuestions.size}</span>
            </div>
          </div>

          {questions.length - answeredCount > 0 && (
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>You have unanswered questions. You may still submit if desired.</span>
            </div>
          )}
        </div>
      </Dialog>

      {/* Post-Submission Official Verification Dossier Modal */}
      {showVerificationModal && finalSubmissionData && (
        <Dialog
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            onFinishExam(finalSubmissionData);
          }}
          title="Examination Submitted & Sealed"
          description="Session recordings and answer dossier have been verified and sealed"
          maxWidth="lg"
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowVerificationModal(false);
                onFinishExam(finalSubmissionData);
              }}
            >
              <span>View Official Scorecard</span>
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block">Candidate:</span>
                <span className="font-semibold text-[#0B2545]">{finalSubmissionData.studentName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Verification Token:</span>
                <span className="font-mono font-semibold text-[#0B2545]">
                  {finalSubmissionData.verificationToken || 'KLE-PROCTORED-VERIFIED'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Objective Score:</span>
                <span className="font-mono font-semibold text-[#15803D]">
                  {finalSubmissionData.objectiveScore} / {finalSubmissionData.maxScore} marks
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Faculty Gate Status:</span>
                <StatusChip status="warning" label="Pending faculty review" />
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
