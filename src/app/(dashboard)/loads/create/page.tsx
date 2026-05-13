"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPinLine,
  FlagCheckered,
  CalendarBlank,
  Clock,
  Sparkle,
  Check,
  MapTrifold,
  Package,
  CurrencyDollar,
  ListChecks,
  Eye,
  LockSimple,
  Truck,
  WarningOctagon,
  ChatCircleText,
  PaperPlaneRight,
  Robot,
  XCircle,
  Spinner
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import PermissionGate from "@/components/PermissionGate";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  title: string;
  commodity: string;
  weight: string;
  equipmentType: string;
  category: string;
  originAddress: string;
  originCity: string;
  originState: string;
  originZip: string;
  pickupDate: string;
  pickupTime: string;
  destAddress: string;
  destCity: string;
  destState: string;
  destZip: string;
  deliveryDate: string;
  deliveryTime: string;
  rate: string;
  rateType: string;
  notesToCarrier: string;
  hazmat: boolean;
  liftgate: boolean;
  teamDriver: boolean;
  trailerLength: string;
}

const INITIAL_STATE: FormData = {
  title: "",
  commodity: "General Freight",
  weight: "",
  equipmentType: "Flatbed",
  category: "Full Truckload",
  originAddress: "",
  originCity: "",
  originState: "",
  originZip: "",
  pickupDate: "",
  pickupTime: "08:00",
  destAddress: "",
  destCity: "",
  destState: "",
  destZip: "",
  deliveryDate: "",
  deliveryTime: "14:00",
  rate: "",
  rateType: "flat",
  notesToCarrier: "",
  hazmat: false,
  liftgate: false,
  teamDriver: false,
  trailerLength: "",
};

const EQUIPMENT_OPTIONS = ["Flatbed", "Dry Van", "Reefer", "Step Deck", "Lowboy", "Tanker", "Power Only"];
const RATE_TYPES = [
  { value: "flat", label: "Flat Rate" },
  { value: "per_mile", label: "Per Mile" },
];

export default function CreateLoadPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOriginPlaceSelect = (place: any) => {
    const city = place.address?.city || place.address?.town || place.address?.village || "";
    const state = place.address?.state || "";
    const zip = place.address?.postcode || "";
    const road = place.address?.road || "";
    setForm((prev) => ({
      ...prev,
      originAddress: road || place.display_name.split(",")[0],
      originCity: city,
      originState: state,
      originZip: zip,
    }));
  };

  const handleDestPlaceSelect = (place: any) => {
    const city = place.address?.city || place.address?.town || place.address?.village || "";
    const state = place.address?.state || "";
    const zip = place.address?.postcode || "";
    const road = place.address?.road || "";
    setForm((prev) => ({
      ...prev,
      destAddress: road || place.display_name.split(",")[0],
      destCity: city,
      destState: state,
      destZip: zip,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.title) { toast.error("Please enter a Load Title"); return false; }
    if (!form.weight || Number(form.weight) <= 0) { toast.error("Please enter a valid weight > 0"); return false; }
    if (!form.equipmentType) { toast.error("Please select an equipment type"); return false; }
    if (!form.originCity || !form.originState || !form.destCity || !form.destState) {
      toast.error("Please enter both pickup and delivery locations");
      return false;
    }
    if (!form.pickupDate || !form.deliveryDate) {
      toast.error("Please enter pickup and delivery dates");
      return false;
    }
    const pDate = new Date(`${form.pickupDate}T${form.pickupTime || '08:00'}:00`);
    const dDate = new Date(`${form.deliveryDate}T${form.deliveryTime || '17:00'}:00`);
    if (pDate <= new Date()) { toast.error("Pickup date must be in the future"); return false; }
    if (dDate <= pDate) { toast.error("Delivery date must be after pickup date"); return false; }
    if (!form.rate || Number(form.rate) <= 0) {
      toast.error("Please enter a valid rate > 0");
      return false;
    }
    return true;
  };

  const handlePost = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        title: form.title,
        commodity: form.commodity,
        weight: Number(form.weight),
        truckType: form.equipmentType,
        origin: {
          address: form.originAddress,
          city: form.originCity,
          state: form.originState,
          zip: form.originZip,
          contactName: "Main Contact",
          contactPhone: "555-0199"
        },
        destination: {
          address: form.destAddress,
          city: form.destCity,
          state: form.destState,
          zip: form.destZip,
          contactName: "Main Contact",
          contactPhone: "555-0199"
        },
        pickupDate: `${form.pickupDate}T${form.pickupTime}:00Z`,
        deliveryDate: `${form.deliveryDate}T${form.deliveryTime}:00Z`,
        rate: Number(form.rate),
        rateType: form.rateType,
        notes: form.notesToCarrier,
        hazmat: form.hazmat,
        liftgate: form.liftgate,
        teamDriver: form.teamDriver,
        trailerLength: form.trailerLength ? Number(form.trailerLength) : undefined,
        shipperName: "Internal", // Added required fields
        shipperPhone: "555-0000",
        shipperEmail: "broker@flow.com"
      };

      // 1. Create the load (will be draft)
      const res = await api.post("/loads", payload);
      const loadId = res.data.data._id;

      // 2. Publish the load
      await api.post(`/loads/${loadId}/post`);

      toast.success("Load published to marketplace!");
      router.push("/marketplace"); // Redirect to marketplace to see it
    } catch (err: any) {
      console.error("Post error:", err);
      const msg = err.response?.data?.error?.details?.fields 
        ? Object.values(err.response.data.error.details.fields).join(", ")
        : err.response?.data?.error?.message || "Failed to post load";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      // Minimal validation for draft
      if (!form.title) { toast.error("Title is required even for drafts"); return; }
      
      const payload = {
        title: form.title,
        commodity: form.commodity,
        weight: form.weight ? Number(form.weight) : 0,
        truckType: form.equipmentType,
        status: "draft",
        origin: { city: form.originCity, state: form.originState, address: form.originAddress, zip: form.originZip, contactName: "Draft", contactPhone: "000" },
        destination: { city: form.destCity, state: form.destState, address: form.destAddress, zip: form.destZip, contactName: "Draft", contactPhone: "000" },
        shipperName: "Draft",
        shipperPhone: "000",
        shipperEmail: "draft@flow.com",
        rate: 0, // Required by DTO
        pickupDate: new Date().toISOString(), // Required by DTO
        deliveryDate: new Date(Date.now() + 86400000).toISOString(), // Required by DTO
      };

      await api.post("/loads", payload);
      toast.success("Draft saved successfully!");
      router.push("/loads");
    } catch (err: any) {
      toast.error("Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const user = useAppSelector((s) => s.auth.user);
  if (user && user.role !== "broker") {
    router.replace("/loads");
    return null;
  }

  return (
    <PermissionGate roles={["broker"]}>
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Post a New Load</h1>
              <p className="text-sm font-semibold text-muted">Fill in the details below to publish your load to the marketplace.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="h-11 px-6 rounded-lg border border-hairline bg-white text-ink text-xs font-bold hover:bg-surface-soft transition-all"
              >
                Save as Draft
              </button>
              <button
                onClick={() => {
                  if (validateForm()) handlePost();
                }}
                disabled={isSubmitting}
                className="h-11 px-6 rounded-lg bg-primary text-white text-xs font-bold shadow-lg hover:bg-primary-active transition-all"
              >
                {isSubmitting ? "Posting..." : "Post Load Now"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: What & Pricing */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Package size={20} weight="bold" />
                  <h2 className="text-base font-bold">Load Details</h2>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Load Title</label>
                  <input
                    className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2.5 text-sm font-medium outline-none focus:border-primary transition-all"
                    placeholder="e.g., Heavy Machinery to Chicago"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Equipment Type</label>
                    <select
                      className="w-full h-10 rounded-lg border border-hairline bg-surface-soft px-3 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.equipmentType}
                      onChange={(e) => update("equipmentType", e.target.value)}
                    >
                      {EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Weight (lbs)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      placeholder="e.g., 42000"
                      value={form.weight}
                      onChange={(e) => update("weight", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Commodity</label>
                  <input
                    className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                    placeholder="e.g., General Freight"
                    value={form.commodity}
                    onChange={(e) => update("commodity", e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CurrencyDollar size={20} weight="bold" />
                  <h2 className="text-base font-bold">Pricing</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Rate ($)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      placeholder="e.g., 2500"
                      value={form.rate}
                      onChange={(e) => update("rate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Rate Type</label>
                    <select
                      className="w-full h-10 rounded-lg border border-hairline bg-surface-soft px-3 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.rateType}
                      onChange={(e) => update("rateType", e.target.value)}
                    >
                      {RATE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ChatCircleText size={20} weight="bold" />
                  <h2 className="text-base font-bold">Internal Notes</h2>
                </div>
                <textarea
                  className="w-full h-24 rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all resize-none"
                  placeholder="Private notes for your team..."
                  value={form.notesToCarrier}
                  onChange={(e) => update("notesToCarrier", e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Route & Dates */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <MapPinLine size={20} weight="bold" />
                  <h2 className="text-base font-bold">Pickup</h2>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Address Autocomplete</label>
                  <LocationAutocomplete
                    value={form.originAddress}
                    onChange={(val) => update("originAddress", val)}
                    onPlaceSelect={handleOriginPlaceSelect}
                    placeholder="Search pickup location..."
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.pickupDate}
                      onChange={(e) => update("pickupDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Time</label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.pickupTime}
                      onChange={(e) => update("pickupTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FlagCheckered size={20} weight="bold" />
                  <h2 className="text-base font-bold">Delivery</h2>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Address Autocomplete</label>
                  <LocationAutocomplete
                    value={form.destAddress}
                    onChange={(val) => update("destAddress", val)}
                    onPlaceSelect={handleDestPlaceSelect}
                    placeholder="Search delivery location..."
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.deliveryDate}
                      onChange={(e) => update("deliveryDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Time</label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                      value={form.deliveryTime}
                      onChange={(e) => update("deliveryTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Toggle */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:underline transition-all"
                >
                  <Sparkle size={16} weight="bold" />
                  {showAdvanced ? "Hide" : "Show"} Advanced Options (Hazmat, Liftgate, etc.)
                </button>

                {showAdvanced && (
                  <div className="rounded-2xl border border-hairline bg-surface-soft p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.hazmat}
                          onChange={(e) => update("hazmat", e.target.checked)}
                          className="h-5 w-5 rounded border-hairline text-primary focus:ring-primary transition-all"
                        />
                        <span className="text-sm font-bold text-ink group-hover:text-primary transition-colors">Hazmat Required</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.liftgate}
                          onChange={(e) => update("liftgate", e.target.checked)}
                          className="h-5 w-5 rounded border-hairline text-primary focus:ring-primary transition-all"
                        />
                        <span className="text-sm font-bold text-ink group-hover:text-primary transition-colors">Liftgate Needed</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.teamDriver}
                          onChange={(e) => update("teamDriver", e.target.checked)}
                          className="h-5 w-5 rounded border-hairline text-primary focus:ring-primary transition-all"
                        />
                        <span className="text-sm font-bold text-ink group-hover:text-primary transition-colors">Team Driver</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-hairline">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Trailer Length (ft)</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm font-medium outline-none focus:border-primary transition-all"
                          placeholder="e.g., 53"
                          value={form.trailerLength}
                          onChange={(e) => update("trailerLength", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-8 mt-4 border-t border-hairline">
             <button
                onClick={() => {
                  if (validateForm()) handlePost();
                }}
                disabled={isSubmitting}
                className="h-14 px-16 rounded-xl bg-primary text-white text-sm font-bold shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={22} className="animate-spin" weight="bold" />
                    Posting Load...
                  </>
                ) : (
                  <>
                    <PaperPlaneRight size={22} weight="bold" />
                    Post This Load to Marketplace
                  </>
                )}
              </button>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
