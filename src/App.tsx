import { useState, useCallback } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { FileDropzone } from './components/FileDropzone';
import { SelectedFileRow } from './components/SelectedFileRow';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { AIChatSidebar } from './components/AIChatSidebar';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { DualAccessScreen } from './components/DualAccessScreen';
import { AuthenticatedWorkspace } from './components/AuthenticatedWorkspace';
import { DataIntelligence } from './components/DataIntelligence';
import { Button } from './components/ui/Button';
import { API_BASE_URL } from './config';
import type { DatasetFile, DatasetProfile, Recommendation } from './types';

type View = 'landing' | 'workspace' | 'onboarding' | 'auth';
type SessionType = 'guest' | 'auth' | null;

export function App() {
  const [user, setUser] = useState<{ user_id: string; email: string; full_name?: string | null } | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [view, setView] = useState<View>('landing');
  const [selectedFile, setSelectedFile] = useState<DatasetFile | null>(null);
  const [isProfiling, setIsProfiling] = useState<boolean>(false);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [datasetId, setDatasetId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [workspaceTab, setWorkspaceTab] = useState<'review' | 'intelligence'>('review');

  const handleAuthSuccess = useCallback(
    (userData: { user_id: string; email: string; full_name?: string | null }) => {
      setUser(userData);
      setSessionType('auth');
      setView('landing');
    },
    []
  );

  const handleSignOut = useCallback(() => {
    setUser(null);
    setSessionType(null);
    setView('landing');
    setSelectedFile(null);
    setProfile(null);
    setRecommendations([]);
    setErrorMessage(null);
    setDismissedReminders(new Set());
  }, []);

  const handleGuestContinue = useCallback(() => {
    setSessionType('guest');
    setView('workspace');
  }, []);

  const handleOnboarding = useCallback(() => {
    setView('onboarding');
  }, []);

  const handleBackToLanding = useCallback(() => {
    setView('landing');
  }, []);

  const handleFileSelect = (file: DatasetFile) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setProfile(null);
    setRecommendations([]);
    setErrorMessage(null);
  };

  const handleApproveAndUpload = async () => {
    if (!selectedFile) return;

    setIsProfiling(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile.file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload and profile dataset.');
      }

      const profileData: DatasetProfile = await response.json();
      setProfile(profileData);
      setDatasetId(profileData.dataset_id);

      const recsResponse = await fetch(`${API_BASE_URL}/api/datasets/${profileData.dataset_id}/recommendations`);
      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData);
      }

      setSelectedFile({ ...selectedFile, approved: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during dataset profiling.');
    } finally {
      setIsProfiling(false);
    }
  };

  const handleUpdateRecommendationStatus = async (
    actionId: string,
    status: 'pending' | 'approved' | 'rejected' | 'investigation'
  ) => {
    if (!profile) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${profile.dataset_id}/recommendations/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ execution_status: status }),
      });

      if (response.ok) {
        setRecommendations((prev) =>
          prev.map((rec) => (rec.action_id === actionId ? { ...rec, execution_status: status } : rec))
        );
      }
    } catch (err) {
      console.error('Failed to update recommendation status', err);
    }
  };

  const handleGeneratePlan = async (objective: string) => {
    if (!profile) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${profile.dataset_id}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate AI plan.');
      }

      const planData = await response.json();
      if (planData.recommendations) {
        setRecommendations(planData.recommendations);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate LLM recommendations.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProfile(null);
    setRecommendations([]);
    setErrorMessage(null);
  };

  const isAuthenticated = sessionType === 'auth';
  const isGuest = sessionType === 'guest';
  const showReminder = (key: string) => !dismissedReminders.has(key);
  const dismissReminder = (key: string) => setDismissedReminders((prev) => new Set([...prev, key]));

  if (view === 'onboarding') {
    return (
      <DualAccessScreen
        onGuestContinue={handleGuestContinue}
        onCreateAccount={() => {
          setView('auth');
        }}
        onSignIn={() => {
          setView('auth');
        }}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        onBack={handleBackToLanding}
      />
    );
  }

  if (!sessionType) {
    return <LandingPage onOpenWorkspace={handleOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans antialiased selection:bg-[#E1E5E3]">
      {isGuest && (
        <div className="bg-[#FFF3E2] border border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]"></span>
            <span>Guest session</span>
          </div>
          <span>Your work is temporary.</span>
        </div>
      )}

      {isAuthenticated ? (
        <AuthenticatedWorkspace
          user={user!}
          onSignOut={handleSignOut}
          onFileUpload={(file) => {
            setSelectedFile({ file, name: file.name, size: file.size, type: file.type, extension: file.name.split('.').pop() || '', uploadProgress: 100, status: 'success', approved: false });
            setErrorMessage(null);
          }}
        />
      ) : (
        <>
          <WorkspaceHeader
            onBackToLanding={handleBackToLanding}
            user={user}
            onSignOut={handleSignOut}
            isGuest={isGuest}
          />
          <main className="max-w-5xl mx-auto py-8 px-6">
            {!profile ? (
              <div className="space-y-8 max-w-3xl mx-auto py-4">
                <div className="space-y-2">
                  <div className="text-xs text-[#2868A6] font-mono font-medium">
                    Step 1 of 3 / Ingestion & Profiling
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#252A2E] m-0">
                    Upload a dataset for analysis
                  </h1>
                  <p className="text-xs text-[#69747D]">
                    Select a CSV, Excel, or JSON file to run deterministic profiling and quality checks before cleaning.
                  </p>
                </div>

                {isProfiling ? (
                  <div className="bg-white border border-[#E1E5E3] rounded-lg p-12 text-center space-y-4 shadow-xs">
                    <div className="w-8 h-8 rounded-full border-2 border-[#252A2E] border-t-transparent animate-spin mx-auto"></div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#252A2E]">Profiling dataset...</h3>
                      <p className="text-xs text-[#69747D]">Running deterministic checks and analyzing data quality.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <FileDropzone onFileSelect={handleFileSelect} />

                    {selectedFile && (
                      <SelectedFileRow
                        selectedFile={selectedFile}
                        onApprove={handleApproveAndUpload}
                        onRemove={handleFileRemove}
                      />
                    )}

                    {errorMessage && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs shadow-xs">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                )}

                {showReminder('after-profiling') && profile && (
                  <div className="max-w-md mx-auto">
                    <BannerReminder
                      title="Your dataset is looking better!"
                      description="Create a free account to save this project, preserve your cleaning history, and return to it anytime."
                      primaryAction={{ label: 'Create Free Account', onClick: () => { setView('auth'); dismissReminder('after-profiling'); } }}
                      secondaryAction={{ label: 'Continue as Guest', onClick: () => dismissReminder('after-profiling') }}
                      onDismiss={() => dismissReminder('after-profiling')}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex gap-1 border-b border-[#E1E5E3] mb-4">
                  <button
                    onClick={() => setWorkspaceTab('review')}
                    className={`-mb-px border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                      workspaceTab === 'review'
                        ? 'border-[#2868A6] text-[#252A2E]'
                        : 'border-transparent text-[#69747D] hover:text-[#252A2E]'
                    }`}
                  >
                    Review & Approve
                  </button>
                  <button
                    onClick={() => setWorkspaceTab('intelligence')}
                    className={`-mb-px border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                      workspaceTab === 'intelligence'
                        ? 'border-[#2868A6] text-[#252A2E]'
                        : 'border-transparent text-[#69747D] hover:text-[#252A2E]'
                    }`}
                  >
                    Data Intelligence
                  </button>
                </div>
                {workspaceTab === 'review' ? (
                  <>
                    <ReviewWorkspace
                      profile={profile}
                      recommendations={recommendations}
                      datasetId={datasetId}
                      onUpdateRecommendationStatus={handleUpdateRecommendationStatus}
                      onGeneratePlan={handleGeneratePlan}
                      onReset={handleReset}
                    />
                    <AIChatSidebar datasetId={datasetId} profile={profile} />
                  </>
                ) : (
                  <DataIntelligence datasetId={datasetId} />
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}

interface BannerReminderProps {
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction: { label: string; onClick: () => void };
  onDismiss: () => void;
}

const BannerReminder: React.FC<BannerReminderProps> = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  onDismiss,
}) => (
  <div className="bg-[#FFF3E2] border border-[#FDE68A] rounded-lg p-4 shadow-xs">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-[#92400E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-[#92400E]">{title}</h4>
        <p className="mt-0.5 text-[10px] text-[#92400E] opacity-90">{description}</p>
      </div>
      <button onClick={onDismiss} className="flex-shrink-0 mt-0.5 p-1 text-[#92400E] opacity-60 hover:opacity-100 rounded" aria-label="Dismiss">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
        {primaryAction.label}
      </Button>
      <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
        {secondaryAction.label}
      </Button>
    </div>
  </div>
);

export default App;
