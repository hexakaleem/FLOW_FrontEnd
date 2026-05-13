'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  IdentificationBadge,
  IdentificationCard,
  Camera,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  MagnifyingGlass,
  Check,
  Gauge,
  UploadSimple
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus } from '@/store/slices/authSlice';
import api from '@/lib/axios';

const authoritySchema = z.object({
  mcNumber: z.string().min(1, 'MC or USDOT number is required'),
});

type AuthorityValues = z.infer<typeof authoritySchema>;

const STEPS = [
  { num: 1, label: 'Authority' },
  { num: 2, label: 'CDL' },
  { num: 3, label: 'ID' },
];

export default function DriverOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const authorityForm = useForm<AuthorityValues>({
    resolver: zodResolver(authoritySchema),
    defaultValues: { mcNumber: '' }
  });

  const handleNext = async () => {
    if (step === 1) {
      if (!verificationResult) {
        toast.error('Please verify your authority first');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const verifyAuthority = async () => {
    const valid = await authorityForm.trigger();
    if (!valid) return;

    setIsVerifying(true);
    setTimeout(() => {
      setVerificationResult(true);
      setIsVerifying(false);
      toast.success('Authority verified!');
    }, 1500);
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const authorityData = authorityForm.getValues();

      await api.patch('/auth/onboarding/profile', {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      });

      await api.patch('/auth/onboarding/business', {});
      await api.patch('/auth/onboarding/stripe', {});
      const prefsRes = await api.patch('/auth/onboarding/prefs', {});
      const newToken = prefsRes.data?.data?.accessToken || localStorage.getItem('token') || '';
      
      localStorage.setItem('token', newToken);
      document.cookie = `accessToken=${newToken}; path=/; max-age=604800; SameSite=Lax`;

      dispatch(updateOnboardingStatus(true));
      
      if (newToken && user) {
        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({
          user,
          accessToken: newToken,
          isOnboardingComplete: true,
          permissions: user.permissions
        }));
      }

      setIsCompleted(true);
      toast.success('Onboarding complete!');
    } catch (error: any) {
      console.error('[DRIVER ONBOARDING] Error:', error);
      toast.error(error.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle size={48} weight="fill" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">You are all set!</h2>
        <p className="mt-2 text-body-text font-medium">Welcome to FLOW. Your driver profile is ready.</p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 inline-flex items-center justify-center gap-2 h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors px-6"
        >
          <Gauge size={20} weight="bold" />
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center">
        <div className="text-[1.8rem] font-semibold text-ink tracking-tight">FLOW</div>
        <h2 className="mt-2 text-xl font-semibold text-ink">Driver Onboarding</h2>
        <p className="text-sm text-body-text font-medium">Complete these steps to start driving</p>
      </div>

      <div className="mb-8 flex items-center justify-center">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={cn(
              "flex flex-col items-center gap-2",
              step >= s.num ? "text-ink" : "text-muted"
            )}>
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                step === s.num ? "border-primary bg-primary text-primary-foreground" :
                step > s.num ? "border-success bg-success text-white" : "border-hairline bg-card"
              )}>
                {step > s.num ? <Check size={18} weight="bold" /> : s.num}
              </div>
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "mx-4 mb-6 h-[2px] w-12 rounded-full",
                step > s.num ? "bg-success" : "bg-hairline"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-hairline bg-card p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <IdentificationBadge size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Verify your authority</h3>
            </div>
            <p className="text-sm font-medium text-body-text">Your MC or USDOT number is issued by the FMCSA.</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">MC or USDOT Number</label>
                <input
                  {...authorityForm.register('mcNumber')}
                  className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", authorityForm.formState.errors.mcNumber && "border-danger")}
                  placeholder="MC-123456"
                />
              </div>

              {!verificationResult && (
                <button
                  onClick={verifyAuthority}
                  disabled={isVerifying}
                  className="w-full h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary-active transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                  {isVerifying ? 'Verifying...' : 'Verify Now'}
                </button>
              )}

              {verificationResult && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="rounded-xl border border-hairline bg-canvas p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check size={18} weight="bold" />
                      </div>
                      <strong className="text-sm text-success">Authority Verified</strong>
                    </div>
                    <div className="flex gap-6 flex-wrap">
                      <div>
                        <span className="text-xs font-medium text-muted">Status</span>
                        <div className="mt-1 badge-pill badge-pill-default">Active</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted">Insurance</span>
                        <div className="mt-1 badge-pill badge-pill-default">Valid</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted">Safety</span>
                        <div className="mt-1 badge-pill badge-pill-default">Satisfactory</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <Camera size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Upload your CDL</h3>
            </div>
            <p className="text-sm font-medium text-body-text">Take a photo or choose from your gallery. Both sides preferred.</p>

            <div className="rounded-xl border-2 border-dashed border-hairline p-10 bg-card hover:border-muted transition-colors cursor-pointer text-center group">
              <div className="mb-4 flex flex-col items-center justify-center text-muted group-hover:text-primary transition-colors">
                <Camera size={48} weight="regular" />
                <p className="mt-4 text-sm font-medium">Take photo or upload</p>
                <p className="mt-2 text-xs font-medium">Accepted: JPG, PNG, PDF</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <IdentificationCard size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Upload Government ID</h3>
            </div>
            <p className="text-sm font-medium text-body-text">A National ID, Passport, or State ID is accepted for identity verification.</p>

            <div className="rounded-xl border-2 border-dashed border-hairline p-10 bg-card hover:border-muted transition-colors cursor-pointer text-center group">
              <div className="mb-4 flex flex-col items-center justify-center text-muted group-hover:text-primary transition-colors">
                <IdentificationCard size={48} weight="regular" />
                <p className="mt-4 text-sm font-medium">Take photo or upload</p>
                <p className="mt-2 text-xs font-medium">Accepted: JPG, PNG, PDF</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between gap-4">
          <button
            onClick={handleBack}
            className={cn("flex-1 h-10 rounded-md border border-hairline bg-card text-ink hover:bg-surface-soft transition-colors text-sm font-medium inline-flex items-center justify-center gap-2", step === 1 && "opacity-0 pointer-events-none")}
          >
            <ArrowLeft size={18} weight="bold" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary-active transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight size={18} weight="bold" />
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={isLoading}
              className="flex-1 h-10 rounded-md bg-success text-white hover:bg-success/90 transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              {isLoading ? 'Completing...' : 'Complete Onboarding'}
              <Check size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
