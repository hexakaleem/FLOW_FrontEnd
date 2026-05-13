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
  LockKey
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus } from '@/store/slices/authSlice';
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
  { num: 1, label: 'Business', desc: 'Company Details' },
  { num: 2, label: 'Authority', desc: 'FMCSA Verification' },
  { num: 3, label: 'Financials', desc: 'Payout Methods' },
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
      
      // Update global storage
      localStorage.setItem('token', newToken);
      document.cookie = `accessToken=${newToken}; path=/; max-age=604800; SameSite=Lax`;

      // Update Redux state with full credentials to ensure seamless transition
      dispatch(updateOnboardingStatus(true));
      if (newToken && user) {
        // We setCredentials to update the token in Redux, preventing stale 403s on next navigation
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
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl" style={{ letterSpacing: '-0.04em' }}>Welcome to FLOW</h2>
        <p className="mt-4 text-lg text-body-text font-medium max-w-md">Your brokerage is now active. You can start posting loads and inviting your team immediately.</p>
        <button
          onClick={() => {
            setIsNavigating(true);
            router.push('/dashboard');
          }}
          disabled={isNavigating}
          className="mt-10 inline-flex items-center justify-center gap-3 h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary-active transition-all px-8 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Gauge size={22} weight="bold" />
          {isNavigating ? 'Redirecting...' : 'Enter Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
      <div className="w-full max-w-[680px] py-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Brand & Progress */}
        <div className="mb-10 text-center">
          <div className="text-[1.2rem] font-bold text-ink tracking-tighter mb-8 opacity-40">FLOW</div>
          
          <div className="flex items-center justify-between px-4 max-w-md mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center relative group">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 z-10",
                  step === s.num ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/10 shadow-sm" :
                  step > s.num ? "border-ink bg-ink text-white" : "border-hairline bg-canvas text-muted group-hover:border-muted"
                )}>
                  {step > s.num ? <Check size={20} weight="bold" /> : s.num}
                </div>
                <div className="absolute top-12 whitespace-nowrap">
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-bold transition-colors",
                    step === s.num ? "text-ink" : "text-muted"
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "absolute left-10 top-5 h-[2px] w-[calc(100vw/3)] sm:w-32 rounded-full -z-0",
                    step > s.num ? "bg-ink" : "bg-hairline"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="mt-16 rounded-2xl border border-hairline bg-canvas p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          
          {/* STEP 1: BUSINESS */}
          {step === 1 && (
            <div id="step1-form" ref={step1Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-3 text-ink mb-2">
                  <div className="p-2 bg-surface-soft rounded-lg">
                    <Briefcase size={22} weight="bold" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Business Profile</h3>
                </div>
                <p className="text-sm font-medium text-muted">Identify your brokerage for load posting and financial verification.</p>
              </div>

              <div className="grid gap-6">
                {/* Legal Name */}
                <div className="space-y-2" data-error={!!businessForm.formState.errors.companyName}>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">Legal Company Name</label>
                  <input
                    {...businessForm.register('companyName')}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium shadow-sm",
                      businessForm.formState.errors.companyName ? "border-error focus:ring-error" : "border-hairline"
                    )}
                    placeholder="Global Logistics Partners LLC"
                  />
                  {businessForm.formState.errors.companyName && (
                    <p className="text-[10px] text-error font-bold mt-1 ml-1 uppercase">{businessForm.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Type */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">Business Type</label>
                    <div className="relative">
                      <select
                        {...businessForm.register('businessType')}
                        className="h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium shadow-sm focus:border-ink transition-all"
                      >
                        <option>LLC</option>
                        <option>Corporation</option>
                        <option>Partnership</option>
                        <option>Sole Proprietorship</option>
                      </select>
                      <CaretDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                  {/* EIN */}
                  <div className="space-y-2" data-error={!!businessForm.formState.errors.ein}>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">Tax EIN</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={14} className="text-muted hover:text-ink cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>9-digit federal identification</TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                      {...businessForm.register('ein')}
                      className={cn(
                        "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-ink focus:ring-1 focus:ring-ink font-medium shadow-sm",
                        businessForm.formState.errors.ein ? "border-error focus:ring-error" : "border-hairline"
                      )}
                      placeholder="XX-XXXXXXX"
                    />
                    {businessForm.formState.errors.ein && (
                      <p className="text-[10px] text-error font-bold mt-1 ml-1 uppercase">{businessForm.formState.errors.ein.message}</p>
                    )}
                  </div>
                </div>

                {/* HQ Address */}
                <div className="space-y-2" data-error={!!businessForm.formState.errors.street}>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">Street Address</label>
                  <input
                    {...businessForm.register('street')}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-ink font-medium shadow-sm",
                      businessForm.formState.errors.street ? "border-error" : "border-hairline"
                    )}
                    placeholder="100 West Washington St."
                  />
                  {businessForm.formState.errors.street && (
                    <p className="text-[10px] text-error font-bold mt-1 ml-1 uppercase">{businessForm.formState.errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2" data-error={!!businessForm.formState.errors.city}>
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">City</label>
                    <input {...businessForm.register('city')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-ink font-medium shadow-sm", businessForm.formState.errors.city ? "border-error" : "border-hairline")} placeholder="Chicago" />
                  </div>
                  <div className="space-y-2 relative" data-error={!!businessForm.formState.errors.state}>
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">State</label>
                    <div className="relative">
                      <select {...businessForm.register('state')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium shadow-sm focus:border-ink", businessForm.formState.errors.state ? "border-error" : "border-hairline")}>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <CaretDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2" data-error={!!businessForm.formState.errors.zip}>
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">ZIP</label>
                    <input {...businessForm.register('zip')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-ink font-medium shadow-sm", businessForm.formState.errors.zip ? "border-error" : "border-hairline")} placeholder="60601" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2" data-error={!!businessForm.formState.errors.phone}>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">Business Phone</label>
                  <input {...businessForm.register('phone')} className={cn("h-11 w-full rounded-lg border bg-canvas px-4 text-sm text-ink outline-none focus:border-ink font-medium shadow-sm", businessForm.formState.errors.phone ? "border-error" : "border-hairline")} placeholder="+1 (312) 555-0123" />
                  {businessForm.formState.errors.phone && (
                    <p className="text-[10px] text-error font-bold mt-1 ml-1 uppercase">{businessForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Logo Upload */}
                <div className="pt-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {logoPreview ? (
                    <div className="flex items-center gap-5 rounded-xl border border-hairline bg-surface-card p-4 animate-in slide-in-from-top-1 duration-300">
                      <img src={logoPreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-hairline shadow-sm bg-white" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-ink truncate">{logoFile?.name}</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Ready to upload</div>
                      </div>
                      <button onClick={removeLogo} className="p-2 text-muted hover:text-error transition-colors"><X size={18} weight="bold" /></button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 rounded-xl border border-hairline bg-surface-card p-5 group cursor-pointer hover:bg-white hover:border-ink/20 transition-all duration-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-canvas border border-hairline text-muted group-hover:text-ink transition-colors">
                        <Camera size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink">Brokerage Logo</div>
                        <p className="text-[11px] font-medium text-muted">Upload high-res PNG or SVG (Optional)</p>
                      </div>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={18} className="text-ink" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AUTHORITY */}
          {step === 2 && (
            <div id="step2-form" ref={step2Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-3 text-ink mb-2">
                  <div className="p-2 bg-surface-soft rounded-lg">
                    <Certificate size={22} weight="bold" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Operating Authority</h3>
                </div>
                <p className="text-sm font-medium text-muted">Real-time FMCSA verification is required to activate your broker profile.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2" data-error={!!authorityForm.formState.errors.mcNumber}>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-0.5">MC Number</label>
                  <div className="flex gap-3">
                    <input
                      {...authorityForm.register('mcNumber')}
                      className={cn(
                        "h-11 flex-1 rounded-lg border bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-ink font-medium shadow-sm",
                        authorityForm.formState.errors.mcNumber ? "border-error" : "border-hairline"
                      )}
                      placeholder="MC-123456"
                      disabled={isVerifying || verificationResult === 'success'}
                    />
                    <button
                      onClick={verifyAuthority}
                      disabled={isVerifying || verificationResult === 'success'}
                      className="h-11 px-8 rounded-lg bg-ink text-white text-xs font-bold hover:bg-black transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                      {isVerifying ? 'Verifying...' : verificationResult === 'success' ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                </div>

                {verificationResult === 'success' && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="rounded-xl border border-success/30 bg-success/5 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
                          <Check size={16} weight="bold" />
                        </div>
                        <div className="text-sm font-bold text-success">Credentials Verified</div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-success/70 tracking-wider">Status</div>
                          <div className="text-sm font-bold text-success">ACTIVE & AUTHORIZED</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-success/70 tracking-wider">Bond Info</div>
                          <div className="text-sm font-bold text-success">$75,000 FILED</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {verificationResult === 'mismatch' && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <WarningCircle size={22} className="text-warning mt-1 shrink-0" weight="fill" />
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-bold text-warning">Type Mismatch Detected</div>
                            <p className="text-[11px] font-medium text-warning/80 mt-1">This MC number belongs to a Carrier authority. If you are a carrier, please switch roles.</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => router.push('/onboarding/carrier')} className="px-3 py-1.5 bg-warning text-white text-[10px] font-bold rounded-md hover:bg-warning/90 transition-all">Switch to Carrier</button>
                            <button onClick={() => setVerificationResult(null)} className="px-3 py-1.5 border border-warning/30 text-warning text-[10px] font-bold rounded-md hover:bg-warning/10 transition-all">Try Again</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-hairline bg-surface-card p-5 flex items-start gap-4">
                  <div className="mt-1 p-1 bg-ink/5 rounded-md">
                    <Info size={16} className="text-ink" weight="bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink">Compliance Notice</p>
                    <p className="text-[11px] leading-relaxed font-medium text-muted">FLOW maintains strict adherence to MAP-21 requirements. All brokers must have active BOC-3 filings and a valid surety bond.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIALS */}
          {step === 3 && (
            <div id="step3-form" ref={step3Ref} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-3 text-ink mb-2">
                  <div className="p-2 bg-surface-soft rounded-lg">
                    <CreditCard size={22} weight="bold" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Financial Setup</h3>
                </div>
                <p className="text-sm font-medium text-muted">Connect your payout account to facilitate load settlements and platform fees.</p>
              </div>

              <div className="py-12 flex flex-col items-center justify-center gap-8 border border-hairline border-dashed rounded-2xl bg-surface-card overflow-hidden">
                <div className="flex items-center gap-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#635BFF] text-3xl font-black text-white shadow-lg transform -rotate-3">S</div>
                  <div className="h-0.5 w-12 bg-hairline relative">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-canvas p-1 rounded-full border border-hairline">
                       <LinkSimple size={14} className="text-muted" />
                     </div>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-ink text-white text-3xl shadow-lg ring-4 ring-ink/5 transform rotate-3">
                    <Bank size={32} weight="fill" />
                  </div>
                </div>

                {!stripeConnected ? (
                  <div className="w-full px-10 text-center space-y-4">
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
                      {isLoading ? 'Redirecting to Stripe...' : 'Link Stripe Account'}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                      <LockKey size={12} weight="bold" />
                      Secure 256-bit AES Encryption
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-10 animate-in zoom-in duration-500">
                    <div className="rounded-xl border-2 border-success bg-white p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 bg-success text-white rounded-bl-lg"><Check size={12} weight="bold" /></div>
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCircle size={24} weight="fill" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-ink">Account Connected</div>
                          <div className="text-xs font-bold text-muted tracking-tight">Chase Business &bull;&bull;&bull;&bull;8812</div>
                        </div>
                        <button onClick={() => setStripeConnected(false)} className="text-[10px] font-bold text-muted hover:text-error transition-colors uppercase tracking-wider underline underline-offset-4">Reset</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-hairline bg-surface-soft p-5">
                <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">PROFILE SUMMARY</h4>
                <div className="grid grid-cols-2 gap-y-3 text-[12px]">
                  <div className="text-muted font-medium">Company</div>
                  <div className="text-ink font-bold truncate">{businessForm.getValues('companyName')}</div>
                  <div className="text-muted font-medium">MC Authority</div>
                  <div className="text-ink font-bold">{authorityForm.getValues('mcNumber')}</div>
                  <div className="text-muted font-medium">Verification</div>
                  <div className="text-success font-bold flex items-center gap-1.5"><CheckCircle size={14} weight="fill" /> COMPLETE</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-hairline flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={handleBack}
              className={cn(
                "order-2 sm:order-1 h-11 px-8 rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft transition-all text-sm font-bold inline-flex items-center justify-center gap-2",
                step === 1 && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft size={18} weight="bold" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="order-1 sm:order-2 h-11 px-10 rounded-lg bg-ink text-white hover:bg-black transition-all text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
              >
                Continue
                <ArrowRight size={18} weight="bold" />
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                disabled={isLoading || !stripeConnected}
                className="order-1 sm:order-2 h-11 px-10 rounded-lg bg-success text-white hover:bg-success/90 transition-all text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? 'Finalizing Profile...' : 'Complete Setup'}
                <Check size={18} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-60">
            End-to-End Encrypted &bull; PCI DSS Compliant &bull; FLOW 2026
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
