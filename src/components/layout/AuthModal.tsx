import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import type { UserProfile, UserRole } from '../../types/exam.ts';
import { INITIAL_USERS } from '../../firebase/seedData.ts';
import { signInUser, registerUser, logoutUser } from '../../firebase/services.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserAuthenticated,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [department, setDepartment] = useState<string>('Department of Computer Science & Engineering');
  const [studentId, setStudentId] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickSelect = async (demoUser: UserProfile) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      onUserAuthenticated(demoUser);
      setSuccessMessage(`Authenticated as ${demoUser.displayName} (${demoUser.role.toUpperCase()})`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        const profile = await signInUser(email.trim(), password);
        onUserAuthenticated(profile);
        setSuccessMessage(`Signed in as ${profile.displayName}`);
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 700);
      } else {
        if (!email || !password || !displayName) {
          throw new Error('Please enter name, email, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const profile = await registerUser({
          email: email.trim(),
          pass: password,
          displayName: displayName.trim(),
          role,
          department,
          studentId: role === 'student' ? studentId.trim() || `CS-2026-${Math.floor(100 + Math.random() * 900)}` : undefined,
        });
        onUserAuthenticated(profile);
        setSuccessMessage(`Account registered for ${profile.displayName}!`);
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 700);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      // Default to guest/first student
      onUserAuthenticated(INITIAL_USERS[2]);
      setSuccessMessage('Signed out successfully.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Logout failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="academic-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with KLE Technological University Crest */}
        <div className="bg-[#0B2545] text-white p-5 flex items-center justify-between border-b border-[#0F4C81]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F4C81] border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <span className="text-xs font-bold tracking-tight text-white">KLE</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-white">KLE Technological University</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E8F0F8]/20 text-white border border-white/20">
                  Secure Auth
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Online Course Examination System Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Banner */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-xs font-semibold">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0B2545] truncate">
                {currentUser.displayName}
              </p>
              <p className="text-[11px] text-[#475569] truncate">
                {currentUser.email} • {currentUser.roleTitle || currentUser.role.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:text-[#B91C1C] bg-[#FEE2E2] hover:bg-[#FEE2E2]/80 px-3 py-1.5 rounded-lg border border-[#FECACA] transition-colors cursor-pointer min-h-[32px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-md transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#0B2545] shadow-xs font-semibold'
                  : 'text-[#475569] hover:text-[#0B2545]'
              }`}
            >
              Sign In (Email & Password)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-md transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#0B2545] shadow-xs font-semibold'
                  : 'text-[#475569] hover:text-[#0B2545]'
              }`}
            >
              Register New Academic User
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Full Name & Academic Title *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kulkarni or Sneha Patil"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B2545] bg-white min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Institutional Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('faculty')}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer min-h-[44px] ${
                        role === 'faculty'
                          ? 'border-[#0F4C81] bg-[#E8F0F8] text-[#0B2545] font-semibold'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#475569] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className={`w-4 h-4 ${role === 'faculty' ? 'text-[#0F4C81]' : 'text-[#475569]'}`} />
                        <span className="text-xs">Faculty / Examiner</span>
                      </div>
                      <p className="text-[11px] text-[#475569] mt-1">
                        Syllabus RAG, exam creation & grading
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer min-h-[44px] ${
                        role === 'student'
                          ? 'border-[#0F4C81] bg-[#E8F0F8] text-[#0B2545] font-semibold'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#475569] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${role === 'student' ? 'text-[#0F4C81]' : 'text-[#475569]'}`} />
                        <span className="text-xs">Student Candidate</span>
                      </div>
                      <p className="text-[11px] text-[#475569] mt-1">
                        Proctored tests, study notes & grievances
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                      Department / School
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-[#0B2545] bg-white min-h-[44px]"
                    />
                  </div>
                  {role === 'student' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                        USN / Student ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. 01FE23BCS045"
                        className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-[#0B2545] bg-white min-h-[44px] font-mono"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                Institutional Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kletech.ac.in"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B2545] bg-white min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B2545] bg-white min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0B2545]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#0F4C81] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#E8F0F8]" />
                  <span>
                    {mode === 'signin' ? 'Sign In with Email & Password' : 'Create Academic Account'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Institutional Switcher */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#475569] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                Demo test accounts
              </span>
              <span className="text-[11px] text-[#64748B]">Verified fixtures</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INITIAL_USERS.map((usr) => (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => handleQuickSelect(usr)}
                  disabled={isLoading}
                  className={`p-3 rounded-lg border text-left transition-all hover:shadow-xs cursor-pointer ${
                    currentUser.id === usr.id
                      ? 'border-[#0F4C81] bg-[#E8F0F8]/50 ring-1 ring-[#0F4C81]'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0B2545] truncate">
                      {usr.displayName}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        usr.role === 'author'
                          ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                          : usr.role === 'faculty'
                          ? 'bg-[#E8F0F8] text-[#0F4C81] border border-[#CBD5E1]'
                          : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                      }`}
                    >
                      {usr.role === 'author' ? 'COE' : usr.role === 'faculty' ? 'Faculty' : 'Student'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 truncate">
                    {usr.roleTitle || usr.department}
                  </p>
                  {usr.attendanceRate < 75 && (
                    <span className="inline-block mt-1 text-[11px] text-[#B91C1C] font-medium">
                      Conditional attendance ({usr.attendanceRate}%)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-5 py-3 flex items-center justify-between text-xs text-[#475569]">
          <span>Institutional RBAC & Multi-Role Governance</span>
          <span className="font-semibold text-[#0B2545]">KLE Tech Autonomous Engine</span>
        </div>
      </div>
    </div>
  );
};
