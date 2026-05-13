'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Buildings,
  Certificate,
  FilePdf,
  CreditCard,
  UploadSimple,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Bank,
  LinkSimple,
  Camera,
  Gauge,
  Clock,
  ArrowCounterClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateOnboardingStatus, setCredentials } from '@/store/slices/authSlice';
import api from '@/lib/axios';

const companySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  ein: z.string().min(9, 'EIN must be 9 digits'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().min(10, 'Phone number is required'),
});

const fmcsaSchema = z.object({
  mcNumber: z.string().min(1, 'MC or USDOT number is required'),
});

type CompanyValues = z.infer<typeof companySchema>;
type FmcsaValues = z.infer<typeof fmcsaSchema>;

const STEPS = [
  { num: 1, label: 'Company Profile', desc: 'Add your company details to start using FLOW.', icon: Buildings },
  { num: 2, label: 'FMCSA Verification', desc: 'Verify your operating authority with FMCSA.', icon: Certificate },
  { num: 3, label: 'Compliance Documents', desc: 'Upload required compliance documents.', icon: UploadSimple },
  { num: 4, label: 'Payment Setup', desc: 'Connect your payment account for transactions.', icon: CreditCard },
];

export default function CarrierOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean>(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      businessType: 'LLC',
      ein: '',
      street: '',
      city: '',
      state: 'TX',
      zip: '',
      phone: '',
    }
  });

  const fmcsaForm = useForm<FmcsaValues>({
    resolver: zodResolver(fmcsaSchema),
    defaultValues: { mcNumber: '' }
  });

  const handleNext = async () => {
    if (step === 1) {
      const valid = await companyForm.trigger();
      if (!valid) return;
      setStep(2);
    } else if (step === 2) {
      const valid = await fmcsaForm.trigger();
      if (!valid) return;
      if (!verificationResult) {
        toast.info('Please verify your authority first');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const verifyFmcsa = async () => {
    const valid = await fmcsaForm.trigger();
    if (!valid) return;

    setIsVerifying(true);
    setTimeout(() => {
      setVerificationResult(true);
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
      const companyData = companyForm.getValues();
      const fmcsaData = fmcsaForm.getValues();

      await api.patch('/auth/onboarding/profile', {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      });

      if (user?.id) {
        await api.post(`/users/${user.id}/business-profile`, {
          companyName: companyData.companyName,
          mcNumber: fmcsaData.mcNumber,
          dotNumber: '',
          address: {
            line1: companyData.street,
            line2: '',
            city: companyData.city,
            state: companyData.state,
            zip: companyData.zip,
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
      toast.success('Onboarding complete!');
    } catch (error: any) {
      console.error('[CARRIER ONBOARDING] Error:', error);
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
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl" style={{ letterSpacing: '-0.04em' }}>You&apos;re all verified!</h2>
        <p className="mt-4 text-lg text-body-text font-medium max-w-md">Welcome to FLOW. Your carrier profile is ready.</p>
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
        <p className="text-sm text-muted font-medium mb-8 leading-relaxed">Get started by setting up your carrier account.</p>
        
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
        
        {/* STEP 1: COMPANY */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 1 of 4</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Create your company profile</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">Set up your carrier profile to start accepting loads. This information will be used for all your communications and compliance.</p>
            </div>

            <div className="grid gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Company Name <span className="text-danger">*</span></label>
                <input
                  {...companyForm.register('companyName')}
                  className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.companyName && "border-danger")}
                  placeholder="e.g., Mike's Carriers LLC"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Business Type <span className="text-danger">*</span></label>
                  <select
                    {...companyForm.register('businessType')}
                    className="h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium focus:border-primary"
                  >
                    <option>LLC</option>
                    <option>Inc.</option>
                    <option>Sole Proprietor</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">EIN (Employer Identification Number) <span className="text-danger">*</span></label>
                  <input
                    {...companyForm.register('ein')}
                    className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.ein && "border-danger")}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Street Address <span className="text-danger">*</span></label>
                <input
                  {...companyForm.register('street')}
                  className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.street && "border-danger")}
                  placeholder="123 Fleet Blvd"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">City <span className="text-danger">*</span></label>
                  <input
                    {...companyForm.register('city')}
                    className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.city && "border-danger")}
                    placeholder="Dallas"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">State <span className="text-danger">*</span></label>
                  <select
                    {...companyForm.register('state')}
                    className="h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none appearance-none font-medium focus:border-primary"
                  >
                    <option>TX</option><option>IL</option><option>CA</option><option>NY</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">ZIP <span className="text-danger">*</span></label>
                  <input
                    {...companyForm.register('zip')}
                    className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.zip && "border-danger")}
                    placeholder="75201"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Business Phone <span className="text-danger">*</span></label>
                <input
                  {...companyForm.register('phone')}
                  className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", companyForm.formState.errors.phone && "border-danger")}
                  placeholder="+1 (555) 000-0000"
                />
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

        {/* STEP 2: FMCSA */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 2 of 4</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Verify your operating authority</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">Your MC or USDOT number is issued by the Federal Motor Carrier Safety Administration (FMCSA). We&apos;ll verify your authority status.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">MC Number <span className="text-danger">*</span></label>
                <input
                  {...fmcsaForm.register('mcNumber')}
                  className={cn("h-11 w-full rounded-lg border border-hairline bg-canvas px-4 text-sm text-ink outline-none transition-all focus:border-primary font-medium", fmcsaForm.formState.errors.mcNumber && "border-danger")}
                  placeholder="MC-XXXXXXX"
                />
              </div>

              <button
                onClick={verifyFmcsa}
                disabled={isVerifying || verificationResult}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary-active transition-all text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <MagnifyingGlass size={18} weight="bold" />
                {isVerifying ? 'Verifying...' : verificationResult ? 'Verified' : 'Verify Now'}
              </button>

              {verificationResult && (
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="rounded-xl border border-hairline bg-surface-soft p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-ink">FMCSA Verification Result</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Legal Name</span>
                        <strong>Mike's Carriers LLC</strong>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Authority Status</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Active</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Insurance</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Valid</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Safety Rating</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">Satisfactory</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Authority Type</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">Common Carrier</span>
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

        {/* STEP 3: COMPLIANCE */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 3 of 4</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Upload compliance documents</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">Both documents are required to complete onboarding and ensure regulatory compliance.</p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-xl border-2 border-dashed border-hairline p-5 bg-surface-soft">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Insurance Certificate</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold"><Check size={10} weight="bold" /> Uploaded</span>
                </div>
                <div className="flex items-center gap-3">
                  <FilePdf size={28} weight="fill" className="text-danger" />
                  <div>
                    <p className="text-xs font-semibold truncate max-w-[120px]">insurance_cert.pdf</p>
                    <p className="text-xs text-muted">890 KB</p>
                  </div>
                </div>
                <button className="mt-4 h-8 px-3 text-xs rounded-md border border-hairline bg-card text-ink hover:bg-surface-soft transition-colors font-medium inline-flex items-center justify-center gap-1">
                  <ArrowCounterClockwise size={12} weight="bold" />
                  Replace
                </button>
              </div>

              <div className="rounded-xl border-2 border-dashed border-hairline p-5 bg-surface-soft hover:border-muted transition-colors cursor-pointer">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Operating Authority Letter</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold"><Clock size={10} weight="bold" /> Pending</span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 text-muted">
                  <UploadSimple size={24} />
                  <p className="mt-2 text-xs font-medium">Click to upload or drag file</p>
                  <p className="text-xs text-muted mt-1">PDF, JPG, PNG · Max 10MB</p>
                </div>
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

        {/* STEP 4: PAYMENTS */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Step 4 of 4</p>
              <h2 className="text-2xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>Connect your payment account</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">FLOW uses Stripe to process all payments securely. Connecting your account takes 2 minutes.</p>
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
                  onClick={() => { setStripeConnected(true); toast.success('Stripe connected!'); }}
                  className="w-full h-12 rounded-lg bg-[#635BFF] text-white text-sm font-bold hover:bg-[#5851e5] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  Connect with Stripe
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
                      <div className="text-xs font-medium text-muted">Bank of America &bull;&bull;&bull;&bull;4242</div>
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
                {isLoading ? 'Completing...' : 'Complete Onboarding'} <Check size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
