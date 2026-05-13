'use client';

import { useState, useRef, useEffect } from 'react';
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
  Gauge,
  Info,
  UploadSimple,
  X,
  MagnifyingGlass,
  WarningCircle,
  Truck,
  CaretDown,
  LockKey,
  Buildings,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus, setCredentials } from '@/store/slices/authSlice';
import api from '@/lib/axios';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */

const businessSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  ein: z.string().regex(/^\d{2}-?\d{7}$/, 'EIN must be 9 digits (XX-XXXXXXX)'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Use 2-letter state code'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  phone: z.string().min(10, 'Phone must be 10 digits'),
});

const authoritySchema = z.object({
  mcNumber: z.string().min(4, 'Valid MC number is required'),
});

type BusinessValues = z.infer<typeof businessSchema>;
type AuthorityValues = z.infer<typeof authoritySchema>;

const STEPS = [
  { num: 1, label: 'Business Profile', desc: 'Add your business details to start using FLOW.', icon: Buildings },
  { num: 2, label: 'Authority Verification', desc: 'Verify your broker authority with FMCSA.', icon: Certificate },
  { num: 3, label: 'Payment Setup', desc: 'Connect your payment account for transactions.', icon: CreditCard },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

function scrollToFirstError(formId: string) {
  setTimeout(() => {
    const container = document.getElementById(formId);
    if (!container) return;
    const firstError = container.querySelector('[data-error="true"]') as HTMLElement | null;
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
  }, 50);
}

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const businessForm = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    mode: 'onTouched',
    defaultValues: {
      companyName: '',
      businessType: 'LLC',
      ein: '',
      street: '',
      city: '',
      state: 'IL',
      zip: '',
      phone: '',
    },
  });

  const authorityForm = useForm<AuthorityValues>({
    resolver: zodResolver(authoritySchema),
    mode: 'onTouched',
    defaultValues: { mcNumber: '' },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const ref = step === 1 ? step1Ref : step === 2 ? step2Ref : step3Ref;
      const firstInput = ref.current?.querySelector('input, select, textarea') as HTMLElement | null;
      firstInput?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (step < 3 && !isCompleted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step, isCompleted]);

  const handleNext = async () => {
    if (step === 1) {
      const valid = await businessForm.trigger();
      if (!valid) {
        scrollToFirstError('step1-form');
        const firstErr = Object.values(businessForm.formState.errors)[0]?.message;
        toast.error(firstErr || 'Please complete the business profile');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const valid = await authorityForm.trigger();
      if (!valid) {
        scrollToFirstError('step2-form');
        toast.error('Enter a valid MC number');
        return;
      }
      if (!verificationResult) {
        toast.info('Verification required to proceed');
        return;
      }
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const verifyAuthority = async () => {
    const valid = await authorityForm.trigger();
    if (!valid) {
      scrollToFirstError('step2-form');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      const mc = authorityForm.getValues('mcNumber').toLowerCase();
      if (mc.includes('carrier')) {
        setVerificationResult('mismatch');
        toast.warning('Authority Type Mismatch');
      } else {
        setVerificationResult('success');
        toast.success('Broker Authority Verified');
      }
      setIsVerifying(false);
    }, 1800);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid image format');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image exceeds 5MB limit');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const completeOnboarding = async () => {
    if (!stripeConnected) {
      toast.error('Stripe connection required');
      return;
    }
    setIsLoading(true);
    try {
      const businessData = businessForm.getValues();
      const authorityData = authorityForm.getValues();

      await api.patch('/auth/onboarding/profile', {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      });

      if (user?.id) {
        await api.post(`/users/${user.id}/business-profile`, {
          companyName: businessData.companyName,
          mcNumber: authorityData.mcNumber,
          address: {
            line1: businessData.street,
            city: businessData.city,
            state: businessData.state,
            zip: businessData.zip,
          },
        });
      }

      await api.patch('/auth/onboarding/business', {});
      await api.patch('/auth/onboarding/stripe', { stripeConnected: true });

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
    } catch (error: unknown) {
      console.error('[BROKER ONBOARDING] Error:', error);
      toast.error('Onboarding failed. Please try again.');
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
        <p className="mt-4 text-lg text-body-text font-medium max-w-md">Welcome to FLOW. Your brokerage is ready to post loads.</p>
        <button
          onClick={() => {
            setIsNavigating(true);
            router.push('/dashboard');
          }}
          disabled={isNavigating}
          className="mt-10 inline-flex items-center justify-center gap-3 h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary-active transition-all px-8 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Gauge size={22} weight="bold" />
          {isNavigating ? 'Redirecting...' : 'Go to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
      <div className="flex w-full rounded-2xl border border-hairline bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Left Sidebar */}
        <div className="w-[320px] bg-gradient-to-b from-primary/5 to-transparent border-r border-hairline p-8 flex-shrink-0 hidden lg:flex flex-col">
          <div className="text-[1.4rem] font-bold text-primary tracking-tighter mb-6">FLOW</div>
          <p className="text-sm text-muted font-medium mb-8 leading-relaxed">Get started by setting up your brokerage account.</p>
          
          <div className="flex flex-col gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isCompleted = step > s.num;
              const isActive = step === s.num;
              const isPending = step < s.num;
              
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
          
          {/* STEP 1: BUSINESS */}
          {step === 1 && (
            <div id="step1-form" ref={step1Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 1 of 3</p>
                <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Create your business profile</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">Set up your brokerage profile to start posting and managing loads. This information will be used for all your communications.</p>
              </div>

              <div className="grid gap-5">
                <div className="space-y-1.5" data-error={!!businessForm.formState.errors.companyName}>
                  <label className="text-xs font-medium text-muted">Company Name</label>
                  <input
                    {...businessForm.register('companyName')}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium",
                      businessForm.formState.errors.companyName ? "border-danger focus:ring-danger" : "border-hairline"
                    )}
                    placeholder="e.g., Smith Brokerage LLC"
                  />
                  {businessForm.formState.errors.companyName && (
                    <p className="text-[10px] text-danger font-bold mt-1">{businessForm.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-medium text-muted">Business Type</label>
                    <div className="relative">
                      <select
                        {...businessForm.register('businessType')}
                        className="h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium focus:border-primary transition-all"
                      >
                        <option>LLC</option>
                        <option>Corporation</option>
                        <option>Partnership</option>
                        <option>Sole Proprietorship</option>
                      </select>
                      <CaretDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5" data-error={!!businessForm.formState.errors.ein}>
                    <label className="text-xs font-medium text-muted">EIN (Employer Identification Number)</label>
                    <input
                      {...businessForm.register('ein')}
                      className={cn(
                        "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium",
                        businessForm.formState.errors.ein ? "border-danger focus:ring-danger" : "border-hairline"
                      )}
                      placeholder="XX-XXXXXXX"
                    />
                    {businessForm.formState.errors.ein && (
                      <p className="text-[10px] text-danger font-bold mt-1">{businessForm.formState.errors.ein.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5" data-error={!!businessForm.formState.errors.street}>
                  <label className="text-xs font-medium text-muted">Street Address</label>
                  <input
                    {...businessForm.register('street')}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium",
                      businessForm.formState.errors.street ? "border-danger" : "border-hairline"
                    )}
                    placeholder="123 Broker Ave"
                  />
                  {businessForm.formState.errors.street && (
                    <p className="text-[10px] text-danger font-bold mt-1">{businessForm.formState.errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5" data-error={!!businessForm.formState.errors.city}>
                    <label className="text-xs font-medium text-muted">City</label>
                    <input {...businessForm.register('city')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-primary font-medium", businessForm.formState.errors.city ? "border-danger" : "border-hairline")} placeholder="Chicago" />
                  </div>
                  <div className="space-y-1.5 relative" data-error={!!businessForm.formState.errors.state}>
                    <label className="text-xs font-medium text-muted">State</label>
                    <div className="relative">
                      <select {...businessForm.register('state')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium focus:border-primary", businessForm.formState.errors.state ? "border-danger" : "border-hairline")}>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <CaretDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5" data-error={!!businessForm.formState.errors.zip}>
                    <label className="text-xs font-medium text-muted">ZIP</label>
                    <input {...businessForm.register('zip')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-primary font-medium", businessForm.formState.errors.zip ? "border-danger" : "border-hairline")} placeholder="60601" />
                  </div>
                </div>

                <div className="space-y-1.5" data-error={!!businessForm.formState.errors.phone}>
                  <label className="text-xs font-medium text-muted">Business Phone</label>
                  <input {...businessForm.register('phone')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-primary font-medium", businessForm.formState.errors.phone ? "border-danger" : "border-hairline")} placeholder="+1 (555) 000-0000" />
                  {businessForm.formState.errors.phone && (
                    <p className="text-[10px] text-danger font-bold mt-1">{businessForm.formState.errors.phone.message}</p>
                  )}
                </div>
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

          {/* STEP 2: AUTHORITY */}
          {step === 2 && (
            <div id="step2-form" ref={step2Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 2 of 3</p>
                <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Verify your Broker Authority</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">Enter your MC number. We&apos;ll verify it has active Broker Authority with FMCSA to ensure compliance.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5" data-error={!!authorityForm.formState.errors.mcNumber}>
                  <label className="text-xs font-medium text-muted">MC Number</label>
                  <input
                    {...authorityForm.register('mcNumber')}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium",
                      authorityForm.formState.errors.mcNumber ? "border-danger" : "border-hairline"
                    )}
                    placeholder="MC-XXXXXXX"
                    value={authorityForm.getValues('mcNumber')}
                    disabled={isVerifying || verificationResult === 'success'}
                  />
                </div>

                <button
                  onClick={verifyAuthority}
                  disabled={isVerifying || verificationResult === 'success'}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary-active transition-all text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                  {isVerifying ? 'Verifying...' : verificationResult === 'success' ? 'Verified' : 'Verify Now'}
                </button>

                {verificationResult === 'success' && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="rounded-xl border border-hairline bg-surface-soft p-5 space-y-3">
                      <h4 className="text-sm font-semibold text-ink">FMCSA Verification Result</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">Legal Name</span>
                          <strong>Smith Brokerage LLC</strong>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">Authority Status</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">Authority Type</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">Broker</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">Bond/Trust</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">$75,000 Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {verificationResult === 'mismatch' && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 space-y-3">
                      <h4 className="text-sm font-semibold text-warning">Authority Type Mismatch</h4>
                      <p className="text-xs text-muted leading-relaxed">This MC number has <strong>Carrier authority</strong>, not Broker authority. Would you like to register as a Carrier instead?</p>
                      <div className="flex gap-2">
                        <button onClick={() => router.push('/onboarding/carrier')} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary-active transition-all inline-flex items-center gap-1">
                          <Truck size={14} /> Switch to Carrier
                        </button>
                        <button onClick={() => setVerificationResult(null)} className="px-3 py-1.5 border border-hairline text-muted text-xs font-semibold rounded-md hover:bg-surface-soft transition-all inline-flex items-center gap-1">
                          <ArrowLeft size={14} weight="bold" /> Try Different MC
                        </button>
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

          {/* STEP 3: FINANCIALS */}
          {step === 3 && (
            <div id="step3-form" ref={step3Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 3 of 3</p>
                <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Connect your payment account</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">FLOW uses Stripe to process all payments securely. As a broker, you&apos;ll make payments through this account.</p>
              </div>

              <div className="flex items-center justify-center gap-5 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#635BFF] text-2xl font-black text-white shadow-lg">S</div>
                <div className="text-muted"><LinkSimple size={24} weight="bold" /></div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl shadow-lg">
                  <Bank size={28} weight="fill" />
                </div>
              </div>

              {!stripeConnected ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => {
                        setStripeConnected(true);
                        setIsLoading(false);
                        toast.success('Stripe Linked Successfully');
                      }, 1200);
                    }}
                    className="w-full h-12 rounded-lg bg-[#635BFF] text-white text-sm font-bold hover:bg-[#5851e5] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
                  </button>
                  <p className="text-center text-xs font-medium text-muted">You&apos;ll be redirected to Stripe to complete setup</p>
                </div>
              ) : (
                <div className="animate-in zoom-in duration-500">
                  <div className="rounded-xl border border-hairline bg-surface-soft p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                        <CheckCircle size={20} weight="fill" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">Stripe Connected</div>
                        <div className="text-xs font-medium text-muted">Chase Business &bull;&bull;&bull;&bull;8812</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-hairline">
                <button onClick={handleBack} className="h-11 px-6 rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-all text-sm font-semibold inline-flex items-center gap-2">
                  <ArrowLeft size={18} weight="bold" /> Back
                </button>
                <button
                  onClick={completeOnboarding}
                  disabled={isLoading || !stripeConnected}
                  className="h-11 px-8 rounded-lg bg-success text-white hover:bg-success/90 transition-all text-sm font-semibold inline-flex items-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? 'Finalizing...' : 'Complete Onboarding'} <Check size={18} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
