import { useState } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { FileDropzone } from './components/FileDropzone';
import { SelectedFileRow } from './components/SelectedFileRow';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { AIChatSidebar } from './components/AIChatSidebar';
import { LandingPage } from './components/LandingPage';
import { API_BASE_URL } from './config';
import type { DatasetFile, DatasetProfile, Recommendation } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [selectedFile, setSelectedFile] = useState<DatasetFile | null>(null);
  const [isProfiling, setIsProfiling] = useState<boolean>(false);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [datasetId, setDatasetId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleUpdateRecommendationStatus = async (actionId: string, status: 'pending' | 'approved' | 'rejected' | 'investigation') => {
    if (!profile) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${profile.dataset_id}/recommendations/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  if (currentView === 'landing') {
    return <LandingPage onOpenWorkspace={() => setCurrentView('workspace')} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans selection:bg-[#E1E5E3]">
      <WorkspaceHeader onBackToLanding={() => setCurrentView('landing')} />
      
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
          </div>
        ) : (
          <>
            <ReviewWorkspace
              profile={profile}
              recommendations={recommendations}
              datasetId={datasetId}
              onUpdateRecommendationStatus={handleUpdateRecommendationStatus}
              onGeneratePlan={handleGeneratePlan}
              onReset={handleReset}
            />
            <AIChatSidebar
              datasetId={datasetId}
              profile={profile}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
