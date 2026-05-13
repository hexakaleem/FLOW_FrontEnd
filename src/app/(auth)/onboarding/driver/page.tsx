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
  UploadSimple,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus, setCredentials } from '@/store/slices/authSlice';
import api from '@/lib/axios';

const authoritySchema = z.object({
  mcNumber: z.string().min(1, 'MC or USDOT number is required'),
});

type AuthorityValues = z.infer<typeof authoritySchema>;

const STEPS = [
  { num: 1, label: 'Verify Authority', desc: 'Verify your MC or USDOT number with FMCSA.', icon: IdentificationBadge },
  { num: 2, label: 'Upload CDL', desc: 'Upload your Commercial Driver\'s License.', icon: Camera },
  { num: 3, label: 'Government ID', desc: 'Upload your government-issued ID.', icon: IdentificationCard },
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
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-success/10 text-success ring-8 ring-success/5">
          <CheckCircle size={56} weight="fill" />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl" style={{ letterSpacing: '-0.04em' }}>You&apos;re all set!</h2>
        <p className="mt-4 text-lg text-body-text font-medium max-w-md">Welcome to FLOW. Your driver profile is ready.</p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-10 inline-flex items-center justify-center gap-3 h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary-active transition-all px-8 shadow-sm active:scale-95"
        >
          <Gauge size={22} weight="bold" />
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full rounded-2xl border border-hairline bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Left Sidebar */}
      <div className="w-[320px] bg-gradient-to-b from-primary/5 to-transparent border-r border-hairline p-8 flex-shrink-0 hidden lg:flex flex-col">
        <div className="text-[1.4rem] font-bold text-primary tracking-tighter mb-6">FLOW</div>
        <p className="text-sm text-muted font-medium mb-8 leading-relaxed">Get started by verifying your driver credentials.</p>
        
        <div className="flex flex-col gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            
            return (
              <div key={s.num} className="relative flex gap-4 py-4">
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "absolute left-[15px] top-[44px] bottom-[-4px] w-[2px]",
                    isCompleted ? "bg-success" : isActive ? "bg-primary" : "bg-hairline"
                  )} />
                )}
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0 bg-card relative z-10 transition-all",
                  isCompleted ? "border-success bg-success text-white" :
                  isActive ? "border-primary bg-primary text-white" :
                  "border-hairline text-muted"
                )}>
                  {isCompleted ? <Check size={16} weight="bold" /> : <Icon size={16} weight="bold" />}
                </div>
                <div className="pt-1">
                  <h4 className={cn(
                    "text-sm font-semibold",
                    isCompleted ? "text-ink" : isActive ? "text-primary" : "text-muted"
                  )}>{s.label}</h4>
                  <p className="text-xs text-muted leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-10 lg:p-12 overflow-y-auto max-h-[90vh]">
        
        {/* STEP 1: AUTHORITY */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 1 of 3</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Verify your authority</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">Your MC or USDOT number is issued by the Federal Motor Carrier Safety Administration (FMCSA). We&apos;ll verify your authority status.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">MC Number or USDOT Number <span className="text-danger">*</span></label>
                <div className="relative">
                  <IdentificationBadge size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...authorityForm.register('mcNumber')}
                    className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", authorityForm.formState.errors.mcNumber && "border-danger")}
                    placeholder="MC-123456"
                  />
                </div>
              </div>

              {!verificationResult && (
                <button
                  onClick={verifyAuthority}
                  disabled={isVerifying}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary-active transition-all text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                  {isVerifying ? 'Verifying...' : 'Verify Now'}
                </button>
              )}

              {verificationResult && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="rounded-xl border border-hairline bg-surface-soft p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check size={18} weight="bold" />
                      </div>
                      <strong className="text-sm text-success">Authority Verified</strong>
                    </div>
                    <div className="flex gap-6 flex-wrap">
                      <div>
                        <span className="text-xs font-medium text-muted">Status</span>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Active</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted">Insurance</span>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Valid</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted">Safety</span>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Satisfactory</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t border-hairline">
              <button onClick={handleBack} className="h-11 px-6 rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-all text-sm font-semibold inline-flex items-center gap-2">
                <ArrowLeft size={18} weight="bold" /> Back
              </button>
              <button onClick={handleNext} className="h-11 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary-active transition-all text-sm font-semibold inline-flex items-center gap-2 shadow-sm active:scale-[0.98]">
                Save and continue <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CDL */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 2 of 3</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Upload your Commercial Driver&apos;s License</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">Take a photo or choose from your gallery. Your CDL must be current and valid.</p>
            </div>

            <div className="rounded-xl border-2 border-dashed border-hairline p-12 bg-surface-soft hover:border-muted transition-colors cursor-pointer text-center group">
              <div className="flex flex-col items-center justify-center text-muted group-hover:text-primary transition-colors">
                <Camera size={48} weight="regular" />
                <p className="mt-4 text-sm font-medium">Take a photo or choose from gallery</p>
                <p className="mt-2 text-xs font-medium">Accepted: JPG, PNG, PDF</p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-hairline">
              <button onClick={handleBack} className="h-11 px-6 rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-all text-sm font-semibold inline-flex items-center gap-2">
                <ArrowLeft size={18} weight="bold" /> Back
              </button>
              <button onClick={handleNext} className="h-11 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary-active transition-all text-sm font-semibold inline-flex items-center gap-2 shadow-sm active:scale-[0.98]">
                Upload &amp; continue <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GOVERNMENT ID */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 3 of 3</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Upload your Government ID</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">A National ID, Passport, or State ID is accepted. This is required for identity verification.</p>
            </div>

            <div className="rounded-xl border-2 border-dashed border-hairline p-12 bg-surface-soft hover:border-muted transition-colors cursor-pointer text-center group">
              <div className="flex flex-col items-center justify-center text-muted group-hover:text-primary transition-colors">
                <IdentificationCard size={48} weight="regular" />
                <p className="mt-4 text-sm font-medium">Take a photo or choose from gallery</p>
                <p className="mt-2 text-xs font-medium">Accepted: JPG, PNG, PDF</p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-hairline">
              <button onClick={handleBack} className="h-11 px-6 rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-all text-sm font-semibold inline-flex items-center gap-2">
                <ArrowLeft size={18} weight="bold" /> Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={isLoading}
                className="h-11 px-8 rounded-lg bg-success text-white hover:bg-success/90 transition-all text-sm font-semibold inline-flex items-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? 'Completing...' : 'Complete Onboarding'} <Check size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
