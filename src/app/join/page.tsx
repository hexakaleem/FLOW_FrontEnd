"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Spinner,
  CheckCircle,
  WarningCircle,
  EnvelopeSimple,
  UserPlus,
  SignOut,
} from "@phosphor-icons/react";
import api from "@/lib/axios";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

// ── Types ───────────────────────────────────────────────────────────────────
type JoinState =
  | { status: "loading" }
  | { status: "success"; orgName?: string }
  | { status: "requires_registration"; email: string; token: string }
  | { status: "error"; code: string; message: string };

// ── Inner component (uses useSearchParams) ───────────────────────────────────
function JoinPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();

  const [state, setState] = useState<JoinState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        code: "MISSING_TOKEN",
        message: "No invitation token provided. Please check your invitation link.",
      });
      return;
    }

    let cancelled = false;

    async function acceptInvite() {
      try {
        const res = await api.post("/teams/accept-invite", { token });

        if (cancelled) return;

        const data = res.data?.data || res.data;

        if (data?.requiresRegistration) {
          setState({
            status: "requires_registration",
            email: data.email,
            token: data.token,
          });
          return;
        }

        // Accepted successfully
        setState({
          status: "success",
          orgName: data?.orgName,
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2500);
      } catch (err: unknown) {
        if (cancelled) return;

        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { error?: { code?: string; message?: string } };
          };
        };
        const errorData = axiosErr.response?.data?.error;
        const status = axiosErr.response?.status;

        if (status === 410) {
          setState({
            status: "error",
            code: "INVITE_EXPIRED",
            message:
              "This invitation has expired. Please ask your team admin to send a new one.",
          });
        } else if (status === 409) {
          setState({
            status: "error",
            code: "ALREADY_MEMBER",
            message: errorData?.message || "You are already a member of this organization.",
          });
        } else if (status === 403 && errorData?.code === 'EMAIL_MISMATCH') {
          setState({
            status: "error",
            code: "EMAIL_MISMATCH",
            message: errorData?.message || "Email mismatch.",
          });
        } else if (status === 404) {
          setState({
            status: "error",
            code: "NOT_FOUND",
            message: "This invitation is invalid or has already been used.",
          });
        } else {
          setState({
            status: "error",
            code: errorData?.code || "UNKNOWN",
            message:
              errorData?.message ||
              "Something went wrong while accepting the invitation.",
          });
        }
      }
    }

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  // ── Loading ───────────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
        <div className="bg-card rounded-[2rem] border border-hairline shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95">
          <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-surface-soft mx-auto mb-6">
            <Spinner size={32} weight="bold" className="animate-spin text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-2">
            Accepting Invitation
          </h1>
          <p className="text-sm font-bold text-muted">
            Please wait while we verify your invitation...
          </p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (state.status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
        <div className="bg-card rounded-[2rem] border border-hairline shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95">
          <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-success-light mx-auto mb-6">
            <CheckCircle size={32} weight="fill" className="text-success" />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-2">
            You&apos;re In!
          </h1>
          <p className="text-sm font-bold text-muted mb-6">
            {state.orgName
              ? `You have successfully joined ${state.orgName}.`
              : "You have successfully joined the team."}
          </p>
          <p className="text-xs font-bold text-muted">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Requires Registration ─────────────────────────────────────────────
  if (state.status === "requires_registration") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
        <div className="bg-card rounded-[2rem] border border-hairline shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95">
          <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-warning-light mx-auto mb-6">
            <EnvelopeSimple size={32} weight="fill" className="text-warning" />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-2">
            Create an Account
          </h1>
          <p className="text-sm font-bold text-muted mb-2">
            You&apos;ve been invited to join a team on FLOW, but you need an
            account first.
          </p>
          <p className="text-xs font-bold text-muted mb-8">
            Once you sign up, you&apos;ll automatically be added to the team.
          </p>
          <Link
            href={`/register?email=${encodeURIComponent(state.email)}&token=${encodeURIComponent(state.token)}`}
            className="btn btn-primary h-12 px-8 text-[11px] font-semibold  shadow-lg  inline-flex items-center gap-2"
          >
            <UserPlus size={18} weight="bold" />
            Sign Up to Join
          </Link>
          <p className="text-[10px] font-bold text-muted mt-4">
            Already have an account?{" "}
            <Link
              href={`/login?redirect=/join?token=${encodeURIComponent(token || "")}`}
              className="text-ink hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="bg-card rounded-[2rem] border border-hairline shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95">
        <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-danger-light mx-auto mb-6">
          <WarningCircle size={32} weight="fill" className="text-danger" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">
          {state.code === "INVITE_EXPIRED"
            ? "Invitation Expired"
            : state.code === "ALREADY_MEMBER"
              ? "Already a Member"
              : state.code === "EMAIL_MISMATCH"
                ? "Wrong Account"
                : "Invalid Invitation"}
        </h1>
        <p className="text-sm font-bold text-muted mb-8">{state.message}</p>

        {state.code === "INVITE_EXPIRED" && (
          <p className="text-xs font-bold text-muted mb-6">
            Contact your team administrator to request a new invitation.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {state.code === "EMAIL_MISMATCH" ? (
            <button
              onClick={() => {
                dispatch(logout());
                router.push(`/login?redirect=/join?token=${token}`);
              }}
              className="btn btn-primary h-12 px-8 text-[11px] font-semibold shadow-lg inline-flex items-center gap-2"
            >
              <SignOut size={18} weight="bold" />
              Log Out
            </button>
          ) : isAuthenticated ? (
            <Link
              href="/dashboard"
              className="btn btn-primary h-12 px-8 text-[11px] font-semibold  shadow-lg "
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary h-12 px-8 text-[11px] font-semibold  shadow-lg "
            >
              Go to Login
            </Link>
          )}
          <Link
            href="/"
            className="btn btn-secondary h-11 text-[11px] font-semibold "
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Exported page (with Suspense boundary for useSearchParams) ───────────────
export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
          <div className="bg-card rounded-[2rem] border border-hairline shadow-2xl p-12 max-w-md w-full text-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-surface-soft mx-auto mb-6">
              <Spinner size={32} weight="bold" className="animate-spin text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-ink">Loading...</h1>
          </div>
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
