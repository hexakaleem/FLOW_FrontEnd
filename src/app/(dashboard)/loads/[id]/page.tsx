"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Scales,
  CurrencyDollar,
  Clock,
  CheckCircle,
  Circle,
  ChatText,
  Package,
  MapTrifold,
  Star,
  X,
  PaperPlaneTilt,
  LockSimple,
  Warning,
  CircleNotch,
  FileText,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import PermissionGate from "@/components/PermissionGate";
import { useSocket } from "@/hooks/useSocket";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedAt: string;
  note: string | null;
}

interface LoadData {
  _id: string;
  orgId: string;
  createdBy: string;
  origin: {
    address: string;
    city: string;
    state: string;
    zip: string;
    contactName: string;
    contactPhone: string;
  };
  destination: {
    address: string;
    city: string;
    state: string;
    zip: string;
    contactName: string;
    contactPhone: string;
  };
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  truckType: string;
  commodity: string | null;
  rate: number;
  rateType: string;
  specialRequirements: string | null;
  status: string;
  statusHistory: StatusHistoryEntry[];
  assignedTruckId: string | null;
  assignedDriverId: string | null;
  estimatedDistance: number | null;
  bookingRequestCount: number;
  confirmedBookingId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookingRequest {
  _id: string;
  carrierOrgId: string;
  carrierUserId: string;
  truckId: string;
  driverId: string;
  proposedRate: number | null;
  status: string;
  respondedAt: string | null;
  denialReason: string | null;
  carrierOrgName?: string;
  carrierInitials?: string;
  riskScore?: number;
  equipmentType?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_TIMELINE = [
  { key: "created", label: "Created", icon: Circle },
  { key: "posted", label: "Load Posted", icon: Circle },
  { key: "booked", label: "Booking Confirmed", icon: Circle },
  { key: "in_transit", label: "Driver Departed", icon: Circle },
  { key: "delivered", label: "Delivered", icon: Circle },
  { key: "cancelled", label: "Cancelled", icon: X },
];

function statusBadge(status: string) {
  switch (status) {
    case "posted":
    case "active":
      return "badge-green";
    case "booked":
      return "badge-indigo";
    case "in_transit":
      return "badge-amber";
    case "delivered":
      return "badge-green";
    case "cancelled":
      return "badge-red";
    default:
      return "badge-gray";
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function formatDateTime(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeOnly(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function equipmentBadge(truckType: string) {
  const t = truckType.toLowerCase();
  if (t === "flatbed") return "badge-blue";
  if (t === "reefer") return "badge-indigo";
  if (t === "dry_van" || t === "dry van") return "badge-green";
  if (t === "step_deck" || t === "step deck") return "badge-amber";
  return "badge-gray";
}

function riskClass(score: number) {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function LoadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAppSelector((s) => s.auth.user);

  const [load, setLoad] = useState<LoadData | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<Record<string, string>>({});
  const [showCounterInput, setShowCounterInput] = useState<string | null>(null);

  const [matchedTrucks, setMatchedTrucks] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const isBroker = user?.role === "broker";

  // Subscribe to real-time updates for this load
  const { subscribeToLoad, unsubscribeFromLoad } = useSocket();
  useEffect(() => {
    if (params.id) {
      subscribeToLoad(params.id as string);
      return () => unsubscribeFromLoad(params.id as string);
    }
  }, [params.id, subscribeToLoad, unsubscribeFromLoad]);

  // -----------------------------------------------------------------------
  // Fetch load & booking requests
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [loadRes, bookingsRes] = await Promise.all([
        api.get(`/loads/${params.id}`),
        api.get(`/loads/${params.id}/booking-requests`),
      ]);

      setLoad(loadRes.data?.data || loadRes.data);
      const bookings: BookingRequest[] = bookingsRes.data?.data ?? [];
      setBookingRequests(bookings);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to fetch load details";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const didFetchRef = React.useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchData();
  }, [fetchData]);

  const fetchMatchedTrucks = useCallback(async () => {
    if (!params.id || !isBroker) return;
    setMatchingLoading(true);
    try {
      const res = await api.get(`/loads/${params.id}/matching-trucks`);
      setMatchedTrucks(res.data?.data?.matches ?? []);
    } catch {
      setMatchedTrucks([]);
    } finally {
      setMatchingLoading(false);
    }
  }, [params.id, isBroker]);

  useEffect(() => {
    if (load && isBroker) fetchMatchedTrucks();
  }, [load, isBroker, fetchMatchedTrucks]);

  // -----------------------------------------------------------------------
  // Broker Actions
  // -----------------------------------------------------------------------

  const handleToggleCounterInput = (requestId: string) => {
    setShowCounterInput((prev) => (prev === requestId ? null : requestId));
    setCounterOffer((prev) => ({ ...prev, [requestId]: "" }));
  };

  const handleAcceptBid = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/loads/${params.id}/booking-confirm`, { requestId });
      toast.success("Booking confirmed!");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to confirm booking";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyBid = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/loads/${params.id}/booking-deny`, { requestId });
      toast.success("Booking request denied");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to deny booking";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterOffer = async (requestId: string) => {
    const amount = counterOffer[requestId];
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid counter offer amount");
      return;
    }
    setActionLoading(requestId);
    try {
      await api.post(`/loads/${params.id}/counteroffer`, {
        proposedRate: Number(amount),
        bookingRequestId: requestId,
      });
      toast.success("Counter offer sent!");
      setShowCounterInput(null);
      setCounterOffer((prev) => ({ ...prev, [requestId]: "" }));
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to send counter offer";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBid = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this bid?")) return;
    setActionLoading(requestId);
    try {
      await api.put(`/loads/${params.id}/bookings/${requestId}/cancel`);
      toast.success("Booking request cancelled");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to cancel booking request";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-6 flex h-full items-center justify-center">
        <CircleNotch
          size={48}
          weight="bold"
          className="animate-spin text-primary"
        />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="p-6 flex h-full items-center justify-center">
        <div className="text-center">
          <Warning
            size={48}
            weight="thin"
            className="mx-auto mb-4 opacity-20"
          />
          <p className="font-bold  text-xs text-muted">
            {error || "Load not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="btn btn-secondary mt-4 text-[10px] font-semibold"
          >
            <ArrowLeft size={16} weight="bold" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isActive = ["posted", "booked", "in_transit"].includes(load.status);
  const canBook =
    user?.role === "carrier" || user?.role === "independent_driver";

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-3 flex items-center gap-2 text-[10px] font-semibold  text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            Loads
          </button>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="badge badge-blue h-7 px-4">
              FL-{load._id.slice(-6).toUpperCase()}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {load.commodity || "Freight"} — {load.origin.city} to{" "}
              {load.destination.city}
            </h1>
            <span className={cn("badge h-7 px-4", statusBadge(load.status))}>
              {statusLabel(load.status)}
            </span>
          </div>
        </div>
        <PermissionGate roles={["broker"]}>
          <div className="flex gap-2">
            {isActive && (
              <button
                onClick={() => router.push(`/tracking/${load._id}`)}
                className="btn btn-secondary btn-sm"
              >
                <MapPin size={16} weight="bold" /> Tracking
              </button>
            )}
          </div>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ================================================================= */}
        {/* LEFT COLUMN                                                     */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* Map */}
          <div className="aspect-[21/9] w-full rounded-2xl bg-surface-soft border-2 border-dashed border-hairline flex items-center justify-center text-muted hover:border-accent/30 transition-colors cursor-pointer group">
            <div className="text-center group-hover:scale-105 transition-transform">
              <MapTrifold
                size={44}
                weight="duotone"
                className="mx-auto mb-2 opacity-20"
              />
              <p className="text-[10px] font-semibold ">
                {load.origin.city}, {load.origin.state} →{" "}
                {load.destination.city}, {load.destination.state}
              </p>
              <p className="text-[11px] font-bold text-muted/60 mt-0.5">
                {load.estimatedDistance || 0} miles
              </p>
            </div>
          </div>

          {/* Load Details */}
          <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
              <Package size={20} weight="bold" className="text-primary" />
              Load Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Commodity
                </div>
                <div className="text-sm font-semibold text-ink">
                  {load.commodity || "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Equipment
                </div>
                <span
                  className={cn(
                    "badge text-[10px]",
                    equipmentBadge(load.truckType),
                  )}
                >
                  {load.truckType}
                </span>
              </div>
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Weight
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Scales size={14} weight="bold" className="text-muted" />
                  {load.weight?.toLocaleString()} lbs
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Pickup
                </div>
                <div className="text-[12px] font-semibold text-ink">
                  {formatDateTime(load.pickupDate)}
                </div>
                <div className="text-[10px] font-bold text-muted">
                  {formatTimeOnly(load.pickupDate)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Delivery
                </div>
                <div className="text-[12px] font-semibold text-ink">
                  {formatDateTime(load.deliveryDate)}
                </div>
                <div className="text-[10px] font-bold text-muted">
                  {formatTimeOnly(load.deliveryDate)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold  text-muted mb-1">
                  Distance
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Truck size={14} weight="bold" className="text-muted" />
                  {load.estimatedDistance || 0} mi
                </div>
              </div>
            </div>

            {/* Special requirements */}
            {load.specialRequirements && (
              <div className="mt-5 pt-5 border-t border-hairline">
                <div className="text-[9px] font-semibold  text-muted mb-2">
                  Special Requirements
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {load.specialRequirements.split(",").map((r) => (
                    <span
                      key={r.trim()}
                      className="badge badge-amber text-[9px]"
                    >
                      {r.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Matched Trucks — broker only, for posted loads */}
          {isBroker && load.status === "posted" && (
            <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight text-ink mb-4 flex items-center gap-2">
                <Truck size={20} weight="bold" className="text-success" />
                Matched Trucks ({matchedTrucks.length})
              </h3>
              {matchingLoading ? (
                <div className="text-center py-6">
                  <CircleNotch size={24} weight="bold" className="animate-spin text-primary mx-auto" />
                </div>
              ) : matchedTrucks.length === 0 ? (
                <div className="text-center py-6 text-muted">
                  <Warning size={32} weight="thin" className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-semibold">No matching trucks found nearby</p>
                  <p className="text-[9px] font-bold text-muted/60 mt-1">
                    Trucks need to update their GPS location to appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {matchedTrucks.map((truck: any, i: number) => (
                    <div
                      key={truck.truckId}
                      className="flex items-center gap-3 rounded-xl bg-surface-soft p-3 border border-hairline"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                          truck.matchScore >= 0.8 ? "bg-success" : truck.matchScore >= 0.5 ? "bg-amber-500" : "bg-muted",
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">
                          {truck.plateNumber} · {truck.truckType?.replace(/_/g, " ")}
                        </div>
                        <div className="text-[10px] font-bold text-muted">
                          {truck.distance?.toFixed(1)} mi away
                          {truck.currentLocation?.city ? ` · ${truck.currentLocation.city}, ${truck.currentLocation.state}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {truck.specs?.hasLiftgate && (
                          <span className="badge badge-indigo text-[8px]">Liftgate</span>
                        )}
                        {truck.specs?.isHazmatCertified && (
                          <span className="badge badge-red text-[8px]">Hazmat</span>
                        )}
                        <span className="text-sm font-semibold text-success">
                          {Math.round(truck.matchScore * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shipment Timeline */}
          <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <Clock size={20} weight="bold" className="text-primary" />
              Shipment Timeline
            </h3>
            <div className="space-y-0 ml-3">
              {STATUS_TIMELINE.map((st, i) => {
                const historyEntry = load.statusHistory?.find(
                  (h) => h.status === st.key,
                );
                const isCompleted = !!historyEntry;
                const isActive = load.status === st.key;
                const isFuture = !isCompleted && !isActive;

                // Don't show cancelled unless it's the status
                if (st.key === "cancelled" && load.status !== "cancelled")
                  return null;

                return (
                  <div
                    key={st.key}
                    className={cn(
                      "relative flex items-start gap-4 pb-6 last:pb-0",
                      isFuture && "opacity-40",
                    )}
                  >
                    {/* Connector line */}
                    {i < STATUS_TIMELINE.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-[9px] top-6 bottom-0 w-0.5",
                          isCompleted ? "bg-success" : "bg-border",
                        )}
                      />
                    )}

                    {/* Dot */}
                    <div
                      className={cn(
                        "relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        isActive
                          ? "border-accent bg-surface-soft shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                          : isCompleted
                            ? "border-success bg-success"
                            : "border-hairline bg-card",
                      )}
                    >
                      {isCompleted && !isActive && (
                        <CheckCircle
                          size={10}
                          weight="fill"
                          className="text-white"
                        />
                      )}
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "text-sm font-semibold ",
                          isFuture ? "text-muted" : "text-ink",
                        )}
                      >
                        {st.label}
                      </div>
                      {historyEntry && (
                        <div className="text-[10px] font-bold text-muted mt-0.5">
                          {formatDateTime(historyEntry.changedAt)}{" "}
                          {formatTimeOnly(historyEntry.changedAt)}
                        </div>
                      )}
                      {isActive && !historyEntry && (
                        <div className="text-[10px] font-bold text-ink mt-0.5">
                          Current
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN                                                    */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold tracking-tight text-ink mb-4 flex items-center gap-2">
              <CurrencyDollar
                size={18}
                weight="bold"
                className="text-success"
              />
              Pricing
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted font-bold">Rate</span>
                <strong className="text-lg text-success">
                  ${load.rate.toLocaleString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted font-bold">Type</span>
                <span className="text-sm font-bold text-ink capitalize">
                  {load.rateType?.replace(/_/g, " ") || "Flat Rate"}
                </span>
              </div>
              {load.estimatedDistance && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted font-bold">Per Mile</span>
                    <span className="text-sm font-bold text-ink">
                      ${(load.rate / load.estimatedDistance).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Assigned Carrier */}
          {load.assignedTruckId && (
            <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold tracking-tight text-ink mb-4 flex items-center gap-2">
                <Truck size={18} weight="bold" className="text-primary" />
                Assigned Carrier
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-white shadow-lg">
                  <Truck size={20} weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">
                    Truck: {load.assignedTruckId?.slice(-6).toUpperCase() || "—"}
                  </div>
                  <div className="text-[10px] font-bold text-muted">
                    Driver: {load.assignedDriverId?.slice(-6).toUpperCase() || "TBD"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/tracking/${load._id}`)}
                  className="btn btn-primary flex-1 text-[10px] font-semibold h-9"
                >
                  <MapPin size={14} weight="bold" /> Track
                </button>
              </div>
            </div>
          )}

          {/* Booking Requests — broker only actions (Accept/Deny/Counter) */}
          <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold tracking-tight text-ink flex items-center gap-2">
                <PaperPlaneTilt
                  size={18}
                  weight="bold"
                  className="text-primary"
                />
                Booking Requests
              </h3>
              {bookingRequests.length > 0 && (
                <span className="badge badge-amber text-[9px]">
                  {bookingRequests.length}
                </span>
              )}
            </div>

            {bookingRequests.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <Warning
                  size={36}
                  weight="thin"
                  className="mx-auto mb-2 opacity-20"
                />
                <p className="text-[10px] font-semibold ">
                  No bids yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="rounded-xl bg-surface-soft p-4 border border-hairline space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-ink">
                          {req.carrierOrgName || "Carrier"}
                        </div>
                        <div className="text-[10px] font-bold text-muted">
                          ${(req.proposedRate || load.rate).toLocaleString()} ·{" "}
                          {req.equipmentType || "Flatbed"}
                        </div>
                      </div>
                      {req.riskScore !== undefined && (
                        <div
                          className={cn(
                            "risk-score h-8 w-8 text-[9px] shadow-sm",
                            riskClass(req.riskScore),
                          )}
                        >
                          {req.riskScore}
                        </div>
                      )}
                    </div>

                    {/* Broker-only: Accept/Deny/Counter booking requests */}
                    <PermissionGate roles={["broker"]}>
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptBid(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn btn-sm flex-1 h-9 text-[10px] font-semibold"
                            style={{
                              backgroundColor: "var(--success)",
                              color: "white",
                              border: "none",
                            }}
                          >
                            {actionLoading === req._id ? (
                              <CircleNotch
                                size={12}
                                weight="bold"
                                className="animate-spin"
                              />
                            ) : (
                              "Accept"
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleCounterInput(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn btn-secondary btn-sm flex-1 h-9 text-[10px] font-semibold"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleDenyBid(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn btn-sm flex-1 h-9 text-[10px] font-semibold text-danger border border-danger/30 hover:bg-danger-light"
                          >
                            Deny
                          </button>
                        </div>
                      )}

                      {req.status === "accepted" && (
                        <div className="badge badge-green text-[9px]">
                          Accepted
                        </div>
                      )}
                      {req.status === "denied" && (
                        <div className="badge badge-red text-[9px]">Denied</div>
                      )}
                      {req.status === "cancelled" && (
                        <div className="badge badge-gray text-[9px]">
                          Cancelled
                        </div>
                      )}

                      {/* Inline counter offer input (Broker Only) */}
                      {showCounterInput === req._id && (
                        <div className="flex gap-2 items-center pt-1">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">
                              $
                            </span>
                            <input
                              type="number"
                              placeholder="Counter offer"
                              value={counterOffer[req._id] || ""}
                              onChange={(e) =>
                                setCounterOffer((prev) => ({
                                  ...prev,
                                  [req._id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-hairline bg-card pl-7 pr-3 py-2 text-xs font-bold outline-none focus:border-ink"
                            />
                          </div>
                          <button
                            onClick={() => handleCounterOffer(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn btn-primary btn-sm h-9 px-4 text-[10px] font-semibold"
                          >
                            {actionLoading === req._id ? (
                              <CircleNotch
                                size={12}
                                weight="bold"
                                className="animate-spin"
                              />
                            ) : (
                              "Send"
                            )}
                          </button>
                        </div>
                      )}
                    </PermissionGate>

                    {/* Carrier-only actions */}
                    <PermissionGate roles={["carrier", "independent_driver"]}>
                      {(req.status === "pending" || (req.status === "accepted" && load.status === "booked")) && (
                        <button
                          onClick={() => handleCancelBid(req._id)}
                          disabled={actionLoading === req._id}
                          className="btn btn-sm w-full h-9 text-[10px] font-semibold text-danger border border-danger/30 hover:bg-danger-light"
                        >
                          {actionLoading === req._id ? (
                            <CircleNotch size={12} weight="bold" className="animate-spin" />
                          ) : (
                            req.status === "accepted" ? "Cancel Booking" : "Withdraw Bid"
                          )}
                        </button>
                      )}
                    </PermissionGate>


                    {/* Carrier/Driver: Submit Booking Request on a load */}
                    <PermissionGate roles={["carrier", "independent_driver"]}>
                      {req.status === "pending" && (
                        <div className="text-[10px] font-bold text-muted italic">
                          Your booking request is pending broker review...
                        </div>
                      )}
                    </PermissionGate>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
