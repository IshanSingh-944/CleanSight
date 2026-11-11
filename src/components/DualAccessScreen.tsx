import React from 'react';
import { Clock, UserPlus } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface AccessOption {
  title: string;
  description: string;
  benefits: string[];
  cta: string;
  ctaHandler: () => void;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary';
}

interface DualAccessScreenProps {
  onGuestContinue: () => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export const DualAccessScreen: React.FC<DualAccessScreenProps> = ({
  onGuestContinue,
  onCreateAccount,
  onSignIn,
}) => {
  const options: AccessOption[] = [
    {
      title: 'Continue as Guest',
      description: 'Explore CleanSight AI instantly. No account or registration required.',
      benefits: [
        'Start cleaning immediately.',
        'Upload and analyze datasets.',
        'Generate AI-powered recommendations.',
        'Download cleaned results.',
        'Temporary session; no persistent project history.',
      ],
      cta: 'Continue as Guest',
      ctaHandler: onGuestContinue,
      icon: <Clock className="w-5 h-5" />,
      variant: 'secondary',
    },
    {
      title: 'Create a Free Account',
      description: 'Create your workspace and keep your data-cleaning projects accessible.',
      benefits: [
        'Save datasets and projects.',
        'Access previous cleaning sessions.',
        'Revisit recommendations and reports.',
        'Maintain persistent cleaning history.',
      ],
      cta: 'Create Free Account',
      ctaHandler: onCreateAccount,
      icon: <UserPlus className="w-5 h-5" />,
      variant: 'primary',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans antialiased flex items-center justify-center px-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            <span>Choose how to start</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#252A2E] mb-2">Access CleanSight AI</h1>
          <p className="text-[#69747D] text-sm leading-relaxed max-w-md mx-auto">
            Start profiling and cleaning your data right away. Creating an account lets you save your work and return to it later.
          </p>
        </div>

        <div className="space-y-4">
          {options.map((option) => (
            <Card key={option.title} padding="md" className="border cursor-pointer hover:border-[#2868A6]/50 transition-colors group">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F7F7F4] border border-[#E1E5E3] text-[#69747D] group-hover:bg-[#252A2E] group-hover:text-white transition-colors">
                  {option.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-[#252A2E] text-sm">{option.title}</h3>
                  <p className="text-xs text-[#69747D] leading-relaxed">{option.description}</p>
                  <ul className="space-y-1.5 text-xs text-[#69747D]">
                    {option.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#2868A6] mt-1 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E1E5E3] flex items-center justify-between">
                <Button variant={option.variant} size="md" onClick={option.ctaHandler} className="w-full sm:w-auto">
                  {option.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-6 border-t border-[#E1E5E3] text-center space-y-3">
          <p className="text-xs text-[#69747D]">
            Already have an account?{' '}
            <button onClick={onSignIn} className="font-semibold text-[#252A2E] hover:underline">
              Sign in
            </button>
          </p>
          <p className="text-[10px] text-[#9CA3AF]">
            Guest sessions are temporary. Download your cleaned results before your session expires.
          </p>
        </div>
      </div>
    </div>
  );
};
