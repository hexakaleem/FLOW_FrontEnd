'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Briefcase,
  Certificate,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Bank,
  LinkSimple,
  Camera,
  Check,
  Gauge
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus } from '@/store/slices/authSlice';
import api from '@/lib/axios';

const businessSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  ein: z.string().min(9, 'EIN must be 9 digits'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().min(10, 'Phone number is required'),
});

const authoritySchema = z.object({
  mcNumber: z.string().min(1, 'MC number is required'),
});

type BusinessValues = z.infer<typeof businessSchema>;
type AuthorityValues = z.infer<typeof authoritySchema>;

const STEPS = [
  { num: 1, label: 'Business' },
  { num: 2, label: 'Authority' },
  { num: 3, label: 'Payments' },
];

export default function BrokerOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'mismatch' | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const businessForm = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      companyName: '',
      businessType: 'LLC',
      ein: '',
      street: '',
      city: '',
      state: 'IL',
      zip: '',
      phone: '',
    }
  });

  const authorityForm = useForm<AuthorityValues>({
    resolver: zodResolver(authoritySchema),
    defaultValues: { mcNumber: '' }
  });

  const handleNext = async () => {
    if (step === 1) {
      const valid = await businessForm.trigger();
      if (!valid) return;
      setStep(2);
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
    // Simulate API call
    setTimeout(() => {
      setVerificationResult('success');
      setIsVerifying(false);
      toast.success('Authority verified!');
    }, 1500);
  };

  const completeOnboarding = async () => {
    if (!stripeConnected) {
      toast.error('Please connect your payment account');
      return;
    }
    setIsLoading(true);
    try {
      const businessData = businessForm.getValues();
      const authorityData = authorityForm.getValues();

      // 1. Save profile step
      await api.patch('/auth/onboarding/profile', {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      });

      // 2. Save business profile to real backend
      if (user?.id) {
        await api.post(`/users/${user.id}/business-profile`, {
          companyName: businessData.companyName,
          mcNumber: authorityData.mcNumber,
          dotNumber: '',
          address: {
            line1: businessData.street,
            line2: '',
            city: businessData.city,
            state: businessData.state,
            zip: businessData.zip,
          },
        });
      }

      // 3. Mark business step complete
      await api.patch('/auth/onboarding/business', {});

      // 4. Mark stripe step complete
      await api.patch('/auth/onboarding/stripe', { stripeConnected: true });

      // 5. Mark prefs step complete — returns a new accessToken with updated claims
      const prefsRes = await api.patch('/auth/onboarding/prefs', {});
      const newToken = prefsRes.data?.data?.accessToken || localStorage.getItem('token') || '';
      localStorage.setItem('token', newToken);
      document.cookie = `accessToken=${newToken}; path=/; max-age=604800; SameSite=Lax`;

      dispatch(updateOnboardingStatus(true));
      setIsCompleted(true);
      toast.success('Onboarding complete!');
    } catch (error: any) {
      console.error('[BROKER ONBOARDING] Error:', error);
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
        <h2 className="text-2xl font-semibold tracking-tight text-ink">You&apos;re all set!</h2>
        <p className="mt-2 text-body-text font-medium">Welcome to FLOW. Your brokerage is ready to post loads.</p>
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
    <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-[1.8rem] font-semibold text-ink tracking-tight">FLOW</div>
        <h2 className="mt-2 text-xl font-semibold text-ink">Broker Onboarding</h2>
        <p className="text-sm text-body-text font-medium">Set up your brokerage profile</p>
      </div>

      {/* Steps */}
      <div className="mb-10 flex items-center justify-center">
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

      {/* Content */}
      <div className="rounded-xl border border-hairline bg-card p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <Briefcase size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Set up your business profile</h3>
            </div>

            <div className="grid gap-5">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">Company Name</label>
                <input
                  {...businessForm.register('companyName')}
                  className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.companyName && "border-danger")}
                  placeholder="e.g., Smith Brokerage LLC"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted">Business Type</label>
                  <select
                    {...businessForm.register('businessType')}
                    className="h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none appearance-none font-medium"
                  >
                    <option>LLC</option>
                    <option>Inc.</option>
                    <option>Sole Proprietor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted">EIN</label>
                  <input
                    {...businessForm.register('ein')}
                    className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.ein && "border-danger")}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">Street Address</label>
                <input
                  {...businessForm.register('street')}
                  className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.street && "border-danger")}
                  placeholder="123 Broker Ave"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted">City</label>
                  <input
                    {...businessForm.register('city')}
                    className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.city && "border-danger")}
                    placeholder="Chicago"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted">State</label>
                  <select
                    {...businessForm.register('state')}
                    className="h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none appearance-none font-medium"
                  >
                    <option>IL</option><option>TX</option><option>CA</option><option>NY</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted">ZIP</label>
                  <input
                    {...businessForm.register('zip')}
                    className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.zip && "border-danger")}
                    placeholder="60601"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">Business Phone</label>
                <input
                  {...businessForm.register('phone')}
                  className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", businessForm.formState.errors.phone && "border-danger")}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">Company Logo (optional)</label>
                <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-hairline p-4 hover:border-muted transition-colors cursor-pointer">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-canvas text-muted">
                    <Camera size={24} />
                  </div>
                  <div className="text-xs font-medium text-muted">Click to upload logo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <Certificate size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Broker Authority</h3>
            </div>
            <p className="text-sm font-medium text-body-text">Enter your MC number. This will be manually verified by our admin team before you can post loads.</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-muted">MC Number</label>
                <input
                  {...authorityForm.register('mcNumber')}
                  className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium", authorityForm.formState.errors.mcNumber && "border-danger")}
                  placeholder="MC-XXXXXXX"
                />
                {authorityForm.formState.errors.mcNumber && (
                  <p className="text-xs text-danger ml-1">{authorityForm.formState.errors.mcNumber.message}</p>
                )}
              </div>

              <div className="rounded-xl border border-hairline bg-primary/5 p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-primary shrink-0 mt-0.5" weight="fill" />
                <p className="text-xs font-medium text-primary">
                  Broker authority is required for all freight brokerages on the FLOW platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard size={24} weight="bold" />
              <h3 className="text-lg font-semibold">Connect your payment account</h3>
            </div>
            <p className="text-sm font-medium text-body-text">FLOW uses Stripe to process all payments securely. As a broker, you&apos;ll make payments through this account.</p>

            <div className="py-6 flex items-center justify-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#635BFF] text-2xl font-semibold text-white">S</div>
              <div className="text-muted"><LinkSimple size={24} weight="bold" /></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary text-2xl"><Bank size={28} weight="bold" /></div>
            </div>

            {!stripeConnected ? (
              <div className="space-y-3">
                <button
                  onClick={() => { setStripeConnected(true); toast.success('Stripe connected!'); }}
                  className="w-full h-11 rounded-md bg-[#635BFF] text-white text-sm font-semibold hover:bg-[#5851e5] transition-colors"
                >
                  Connect with Stripe
                </button>
                <p className="text-center text-xs font-medium text-muted">You&apos;ll be redirected to Stripe to complete setup</p>
              </div>
            ) : (
              <div className="rounded-xl border border-hairline bg-canvas p-4 animate-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle size={20} weight="fill" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">Stripe Connected</div>
                    <div className="text-xs font-medium text-muted">Chase Business &bull;&bull;&bull;&bull;8812</div>
                  </div>
                </div>
              </div>
            )}
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
              disabled={isLoading || !stripeConnected}
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
