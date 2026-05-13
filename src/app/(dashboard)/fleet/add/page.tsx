"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  UploadSimple,
  ArrowRight,
  Check,
  XCircle,
  Spinner,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import Link from "next/link";

// ──────────────────────────────────────────────────── constants ─────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "VIN & Plate" },
  { num: 2, label: "Specs" },
  { num: 3, label: "Documents" },
];

const EQUIPMENT_TYPES = [
  { value: "dryVan", label: "Dry Van" },
  { value: "flatbed", label: "Flatbed" },
  { value: "reefer", label: "Reefer" },
  { value: "stepDeck", label: "Step Deck" },
  { value: "tanker", label: "Tanker" },
  { value: "powerOnly", label: "Power Only" },
];

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

// ──────────────────────────────────────────────────── types ──────────────────────────────────────────────────────

interface VinDecodeResult {
  year: number;
  make: string;
  model: string;
  engine: string;
}

// ────────────────────────────────────────────── add vehicle page ─────────────────────────────────────────────────

export default function AddVehiclePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // VIN decode
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinData, setVinData] = useState<VinDecodeResult | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);

  // step 1 fields
  const [vin, setVin] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [plateState, setPlateState] = useState("");
  const [internalId, setInternalId] = useState("");

  // step 2 fields — populated from VIN decode if available
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [equipmentType, setEquipmentType] = useState("dryVan");
  const [maxPayload, setMaxPayload] = useState("");
  const [trailerLength, setTrailerLength] = useState("");
  const [hasLiftgate, setHasLiftgate] = useState(false);
  const [isHazmatCertified, setIsHazmatCertified] = useState(false);

  // step 3 fields
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);

  // ── VIN decode ─────────────────────────────────────────────────────────────────────────

  const handleDecodeVin = async () => {
    const normalized = vin.trim().toUpperCase();

    if (normalized.length < 17) {
      setVinError("Please enter a valid 17-character VIN.");
      toast.error("Please enter a valid 17-character VIN");
      return;
    }

    setVinError(null);
    setIsDecodingVin(true);

    try {
      // Use the standalone VIN decode endpoint - no truck creation needed
      const decodeRes = await api.get(`/fleet/vin-decode/${normalized}`);

      const result: VinDecodeResult = decodeRes.data?.data ?? decodeRes.data;

      setVinData(result);
      setYear(String(result.year));
      setMake(result.make);
      setModel(result.model);
      toast.success("VIN decoded successfully");
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to decode VIN. Please enter specs manually.";
      setVinError(message);
      toast.error(message);
    } finally {
      setIsDecodingVin(false);
    }
  };

  // ── save vehicle ───────────────────────────────────────────────────────────────────────

  const handleSaveVehicle = async () => {
    setIsSaving(true);

    const payload = {
      vin: vin.trim().toUpperCase(),
      plateNumber,
      plateState,
      internalId,
      type: equipmentType,
      year: Number(year),
      make,
      model,
      specs: {
        maxWeight: maxPayload ? Number(maxPayload) : null,
        length: trailerLength ? Number(trailerLength) : null,
        hasLiftgate,
        isHazmatCertified,
      },
    };

    try {
      const response = await api.post("/fleet/trucks", payload);
      const truckId = response.data?.data?._id || response.data?._id;

      // Upload documents if present
      if (registrationFile || insuranceFile) {
        const formData = new FormData();
        if (registrationFile) formData.append("registration", registrationFile);
        if (insuranceFile) formData.append("insurance", insuranceFile);

        try {
          await api.post(`/fleet/trucks/${truckId}/documents`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          // Documents upload is best-effort; vehicle already saved
          toast.warning(
            "Vehicle saved but document upload failed. You can upload them later.",
          );
        }
      }

      toast.success("Vehicle registered successfully");
      router.push("/fleet");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to save vehicle",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!plateNumber.trim()) return toast.error("License plate is required");
      if (!plateState) return toast.error("License plate state is required");
      if (!internalId.trim()) return toast.error("Internal ID is required");
    }
    if (step === 2) {
      if (!year) return toast.error("Year is required");
      if (!make.trim()) return toast.error("Make is required");
      if (!model.trim()) return toast.error("Model is required");
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── render ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[600px] mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* back link */}
      <Link
        href="/fleet"
        className="mb-4 inline-flex items-center gap-1.5  font-semibold  text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} weight="bold" />
        Back to Fleet
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight text-ink mb-8">
        Register a New Vehicle
      </h1>

      {/* ── step indicator ───────────────────────────────────────────────────────────────── */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex flex-col items-center gap-2",
                step >= s.num ? "text-ink" : "text-muted",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all",
                  step === s.num
                    ? "border-primary bg-primary text-white shadow-sm"
                    : step > s.num
                      ? "border-success bg-success text-white"
                      : "border-hairline bg-card",
                )}
              >
                {step > s.num ? <Check size={20} weight="bold" /> : s.num}
              </div>
              <span className=" font-semibold ">
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-4 mb-6 h-[2px] flex-1 rounded-full",
                  step > s.num ? "bg-success" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── step content card ────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-hairline bg-card p-10 shadow-2xl">
        {/* ─── Step 1: VIN & Plate ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              VIN &amp; Plate Number
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  License Plate <span className="text-danger">*</span>
                </label>
                <input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="FB-2847"
                  className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  State <span className="text-danger">*</span>
                </label>
                <select
                  value={plateState}
                  onChange={(e) => setPlateState(e.target.value)}
                  className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                VIN Number <span className="text-danger">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={vin}
                  onChange={(e) => {
                    setVin(e.target.value.toUpperCase());
                    setVinError(null);
                  }}
                  maxLength={17}
                  placeholder="3AKJHHDR5LSLN4829"
                  className="flex-1 rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={handleDecodeVin}
                  disabled={isDecodingVin}
                  className="btn btn-secondary px-5 text-[11px] font-semibold "
                >
                  {isDecodingVin ? (
                    <Spinner size={16} weight="bold" className="animate-spin" />
                  ) : (
                    "Decode"
                  )}
                </button>
              </div>
              {vinError && (
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-danger">
                  <XCircle size={14} /> {vinError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Internal ID <span className="text-danger">*</span>
              </label>
              <input
                value={internalId}
                required
                onChange={(e) => setInternalId(e.target.value)}
                placeholder="e.g. TRK-001"
                className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            {/* VIN decode result */}
            {vinData && (
              <div className="rounded-md border border-success/20 bg-success-light p-6 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle
                    size={24}
                    weight="fill"
                    className="text-success"
                  />
                  <strong className="text-sm font-semibold text-success ">
                    VIN Decoded Successfully
                  </strong>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className=" font-semibold  text-muted">
                      Year
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {vinData.year}
                    </div>
                  </div>
                  <div>
                    <div className=" font-semibold  text-muted">
                      Make
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {vinData.make}
                    </div>
                  </div>
                  <div>
                    <div className=" font-semibold  text-muted">
                      Model
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {vinData.model}
                    </div>
                  </div>
                  <div>
                    <div className=" font-semibold  text-muted">
                      Engine
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {vinData.engine}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Specs ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              Specifications
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Year <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2021"
                  className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Make <span className="text-danger">*</span>
                </label>
                <input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Freightliner"
                  className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Model <span className="text-danger">*</span>
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Cascadia"
                  className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Equipment Type
              </label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink outline-none appearance-none cursor-pointer"
              >
                {EQUIPMENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Max Payload (lbs)
              </label>
              <input
                type="number"
                value={maxPayload}
                onChange={(e) => setMaxPayload(e.target.value)}
                placeholder="48000"
                className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Trailer Length (ft)
              </label>
              <input
                type="number"
                value={trailerLength}
                onChange={(e) => setTrailerLength(e.target.value)}
                placeholder="53"
                className="w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-sm font-bold text-ink placeholder:text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="ml-1  font-semibold  text-muted">
                Capabilities
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setHasLiftgate(!hasLiftgate)}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-md border font-semibold transition-all text-sm",
                    hasLiftgate
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-surface-soft border-hairline text-muted hover:border-muted",
                  )}
                >
                  {hasLiftgate ? "✓" : ""} Liftgate
                </button>
                <button
                  onClick={() => setIsHazmatCertified(!isHazmatCertified)}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-md border font-semibold transition-all text-sm",
                    isHazmatCertified
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-surface-soft border-hairline text-muted hover:border-muted",
                  )}
                >
                  {isHazmatCertified ? "✓" : ""} Hazmat Certified
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Documents ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              Upload Documents
            </h3>

            {/* Vehicle Registration */}
            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Vehicle Registration (required)
              </label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all group",
                  registrationFile
                    ? "border-success/40 bg-success-light/50"
                    : "border-hairline hover:border-ink bg-card",
                )}
              >
                {registrationFile ? (
                  <div className="text-center">
                    <CheckCircle
                      size={28}
                      weight="fill"
                      className="mx-auto mb-2 text-success"
                    />
                    <p className="text-xs font-bold text-success ">
                      {registrationFile.name}
                    </p>
                    <p className=" text-muted mt-1">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadSimple
                      size={32}
                      weight="regular"
                      className="mb-2 text-muted group-hover:text-ink transition-colors"
                    />
                    <p className="text-xs font-bold text-muted ">
                      Drag file here or click to browse
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setRegistrationFile(e.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </label>
            </div>

            {/* Insurance Certificate */}
            <div className="space-y-2">
              <label className="ml-1  font-semibold  text-muted">
                Insurance Certificate (required)
              </label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all group",
                  insuranceFile
                    ? "border-success/40 bg-success-light/50"
                    : "border-hairline hover:border-ink bg-card",
                )}
              >
                {insuranceFile ? (
                  <div className="text-center">
                    <CheckCircle
                      size={28}
                      weight="fill"
                      className="mx-auto mb-2 text-success"
                    />
                    <p className="text-xs font-bold text-success ">
                      {insuranceFile.name}
                    </p>
                    <p className=" text-muted mt-1">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadSimple
                      size={32}
                      weight="regular"
                      className="mb-2 text-muted group-hover:text-ink transition-colors"
                    />
                    <p className="text-xs font-bold text-muted ">
                      Drag file here or click to browse
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setInsuranceFile(e.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* ── navigation ────────────────────────────────────────────────────────────────── */}
        <div className="mt-10 flex gap-4">
          <button
            onClick={handleBack}
            className={cn(
              "btn btn-secondary flex-1 h-12 text-[11px] font-semibold ",
              step === 1 && "opacity-0 pointer-events-none",
            )}
          >
            <ArrowLeft size={18} weight="bold" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="btn btn-primary flex-1 h-12 text-[11px] font-semibold  shadow-sm"
            >
              Next
              <ArrowRight size={18} weight="bold" />
            </button>
          ) : (
            <button
              onClick={handleSaveVehicle}
              disabled={isSaving}
              className="btn btn-primary flex-1 h-12 bg-success border-success text-[11px] font-semibold  shadow-sm"
            >
              {isSaving ? "Saving..." : "Save Vehicle"}
              <Check size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
