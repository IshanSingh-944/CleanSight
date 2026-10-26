import { useState } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { FileDropzone } from './components/FileDropzone';
import { SelectedFileRow } from './components/SelectedFileRow';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { AIChatSidebar } from './components/AIChatSidebar';
import { API_BASE_URL } from './config';
import type { DatasetFile, DatasetProfile, Recommendation } from './types';

export function App() {
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

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#1c1c1a] font-sans selection:bg-stone-200">
      <WorkspaceHeader />
      
      <main className="max-w-4xl mx-auto py-8 px-6">
        {!profile ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="text-xs text-stone-500 font-mono">
                Step 1 of 3 / Ingestion & Profiling
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1a] m-0">
                Upload a dataset
              </h1>
              <p className="text-xs text-stone-600">
                Select a file to review it before analysis or cleaning.
              </p>
            </div>

            {isProfiling ? (
              <div className="bg-white border border-[#e6e5e0] rounded-lg p-12 text-center space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-transparent animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#1c1c1a]">Profiling dataset...</h3>
                  <p className="text-xs text-stone-500">Running deterministic checks and analyzing data quality.</p>
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
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
              recommendations={recommendations}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
