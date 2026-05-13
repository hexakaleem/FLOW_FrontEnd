"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  IdentificationBadge,
  User,
  UserPlus,
  UserMinus,
  NavigationArrow,
  LinkSimple,
  CalendarCheck,
  Warning,
  Spinner,
  CheckCircle,
  Engine,
  Cube,
  Prohibit,
  Trash,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

// ──────────────────────────────────────────────────── types ────────────────────────────────────────────────────

interface Truck {
  _id: string;
  vin: string;
  plateNumber: string;
  plateState: string;
  internalId: string;
  status: "available" | "in_transit" | "booked" | "disabled" | "removed" | "decommissioned";
  type: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  maxPayload?: number;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  gpsDeviceId: string | null;
  trailerId: string | null;
  trailerInfo?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DriverInfo {
  _id: string;
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
  };
  cdlNumber?: string;
  cdlExpiry?: string;
  medicalCardExpiry?: string;
}

// ─────────────────────────────────────────────────── helpers ───────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "available":
      return "badge-green";
    case "in_transit":
      return "badge-amber";
    case "booked":
      return "badge-indigo";
    case "disabled":
      return "badge-gray";
    default:
      return "badge-muted";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "available":
      return "Available";
    case "in_transit":
      return "In Transit";
    case "booked":
      return "Booked";
    case "disabled":
      return "Disabled";
    default:
      return status;
  }
}

function daysUntil(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ─────────────────────────────────────────────── truck detail page ─────────────────────────────────────────────

export default function TruckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const truckId = params?.id as string;

  const [truck, setTruck] = useState<Truck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // driver
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(false);

  // assign driver modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<DriverInfo[]>([]);
  const [isFetchingDrivers, setIsFetchingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // unassign
  const [isUnassigning, setIsUnassigning] = useState(false);

  // ── fetch truck ────────────────────────────────────────────────────────────────────────

  const fetchTruck = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/fleet/trucks/${truckId}`);
      const data =
        response.data?.data?.truck ?? response.data?.data ?? response.data;
      setTruck(data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to load truck details",
      );
      router.push("/fleet");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (truckId) fetchTruck();
  }, [truckId]);

  // ── fetch driver details ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!truck?.assignedDriverId) return;

    const fetchDriver = async () => {
      setIsLoadingDriver(true);
      try {
        const response = await api.get(
          `/teams/members/${truck.assignedDriverId}`,
        );
        setDriver(response.data?.data ?? response.data);
      } catch {
        // driver might have been removed from team
      } finally {
        setIsLoadingDriver(false);
      }
    };

    fetchDriver();
  }, [truck?.assignedDriverId]);

  // ── assign driver ────────────────────────────────────────────────────────────────────────

  const openAssignModal = async () => {
    setIsAssignModalOpen(true);
    setIsFetchingDrivers(true);
    try {
      const response = await api.get("/teams/members?role=driver");
      setAvailableDrivers(response.data?.data ?? []);
    } catch {
      toast.error("Failed to load available drivers");
    } finally {
      setIsFetchingDrivers(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) return;

    setIsAssigning(true);
    try {
      const selected = availableDrivers.find(
        (d) => d.userId === selectedDriverId,
      );
      const driverName = selected
        ? `${selected.profile.firstName} ${selected.profile.lastName}`
        : "";

      await api.patch(`/fleet/trucks/${truckId}/assign-driver`, {
        driverId: selectedDriverId,
        driverName,
      });

      toast.success("Driver assigned successfully");
      setIsAssignModalOpen(false);
      setSelectedDriverId("");
      fetchTruck();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to assign driver",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignDriver = async () => {
    if (!confirm("Remove this driver from the truck?")) return;

    setIsUnassigning(true);
    try {
      await api.patch(`/fleet/trucks/${truckId}/assign-driver`, {
        driverId: null,
        driverName: null,
      });
      toast.success("Driver unassigned");
      setDriver(null);
      fetchTruck();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to unassign driver",
      );
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleDeactivate = async () => {
    if (!truck) return;
    const isCurrentlyDisabled = truck.status === "disabled";
    const newStatus = isCurrentlyDisabled ? "available" : "disabled";
    
    if (!confirm(`Are you sure you want to ${isCurrentlyDisabled ? "activate" : "deactivate"} this truck?`)) return;

    try {
      await api.patch(`/fleet/trucks/${truckId}`, { status: newStatus });
      toast.success(`Truck ${isCurrentlyDisabled ? "activated" : "deactivated"} successfully`);
      fetchTruck();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to update truck status");
    }
  };

  const handleRemoveTruck = async () => {
    if (!truck) return;
    
    if (!confirm("Are you sure you want to PERMANENTLY remove this truck from your active fleet? This action cannot be undone.")) return;

    try {
      await api.delete(`/fleet/trucks/${truckId}`);
      toast.success("Truck removed successfully");
      router.push("/fleet");
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to remove truck");
    }
  };

  // ── loading state ──────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 animate-in fade-in duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-32 bg-card animate-pulse rounded-lg mb-8" />
          <div className="rounded-3xl border border-hairline bg-card p-10">
            <div className="space-y-6">
              <div className="h-8 w-64 bg-muted/20 animate-pulse rounded-lg" />
              <div className="h-4 w-48 bg-muted/20 animate-pulse rounded-lg" />
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted/20 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!truck) return null;

  const cdlDaysLeft = daysUntil(driver?.cdlExpiry);
  const medDaysLeft = daysUntil(driver?.medicalCardExpiry);

  // ── render ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto">
        {/* back link */}
        <Link
          href="/fleet"
          className="mb-6 inline-flex items-center gap-1.5 text-[10px] font-semibold  text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to Fleet
        </Link>

        {/* header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {truck.year} {truck.make} {truck.model}
            </h1>
            <p className="text-sm font-bold text-muted  mt-1">
              {truck.internalId ||
                `Truck #${truck._id.slice(-6).toUpperCase()}`}
            </p>
          </div>
          <span
            className={cn(
              "badge text-[13px] h-9 px-6",
              statusBadge(truck.status),
            )}
          >
            {statusLabel(truck.status)}
          </span>
        </div>

        {/* spec cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* main specs */}
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <Truck size={22} weight="bold" className="text-primary" />
              Vehicle Specifications
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  Year
                </div>
                <div className="text-sm font-semibold text-ink">
                  {truck.year || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  Make
                </div>
                <div className="text-sm font-semibold text-ink">
                  {truck.make || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  Model
                </div>
                <div className="text-sm font-semibold text-ink">
                  {truck.model || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  Equipment Type
                </div>
                <span className="badge badge-blue">
                  {truck.type?.replace(/_/g, " ") || "N/A"}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  VIN
                </div>
                <div className="text-sm font-mono font-bold text-ink">
                  {truck.vin || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold  text-muted mb-1">
                  License Plate
                </div>
                <div className="text-sm font-semibold text-ink">
                  {truck.plateNumber
                    ? `${truck.plateNumber}${truck.plateState ? ` (${truck.plateState})` : ""}`
                    : "N/A"}
                </div>
              </div>
              {truck.engine && (
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold  text-muted mb-1">
                    <Engine size={12} weight="bold" className="inline mr-1" />
                    Engine
                  </div>
                  <div className="text-sm font-bold text-ink">
                    {truck.engine}
                  </div>
                </div>
              )}
              {truck.maxPayload != null && (
                <div>
                  <div className="text-[10px] font-semibold  text-muted mb-1">
                    Max Payload
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {truck.maxPayload.toLocaleString()} lbs
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* driver / assignment section */}
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <IdentificationBadge
                size={22}
                weight="bold"
                className="text-primary"
              />
              Assigned Driver
            </h3>

            {truck.assignedDriverId ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-soft/50 border border-hairline/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-soft text-ink text-sm font-semibold">
                    {truck.assignedDriverName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {truck.assignedDriverName}
                    </div>
                    <div className="text-[11px] font-medium text-muted">
                      {isLoadingDriver
                        ? "Loading info..."
                        : (driver?.profile?.email ?? "Driver assigned")}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUnassignDriver}
                  disabled={isUnassigning}
                  className="btn btn-ghost-danger w-full h-10 text-[11px] font-semibold  text-danger"
                >
                  <UserMinus size={16} weight="bold" />
                  {isUnassigning ? "Removing..." : "Unassign Driver"}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-hairline text-center">
                  <User
                    size={28}
                    weight="thin"
                    className="mb-2 text-muted opacity-50"
                  />
                  <p className="text-[11px] font-bold text-muted ">
                    No driver assigned
                  </p>
                </div>

                <button
                  onClick={openAssignModal}
                  className="btn btn-primary w-full h-10 text-[11px] font-semibold  "
                >
                  <UserPlus size={16} weight="bold" />
                  Assign Driver
                </button>
              </div>
            )}
          </div>

          {/* GPS device */}
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <NavigationArrow
                size={22}
                weight="bold"
                className="text-primary"
              />
              GPS Device
            </h3>
            {truck.gpsDeviceId ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-success-light/30 border border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="text-success"
                  />
                  <div>
                    <div className="text-[10px] font-semibold  text-muted">
                      Device ID
                    </div>
                    <div className="text-sm font-mono font-bold text-ink">
                      {truck.gpsDeviceId}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost text-[10px] font-semibold  text-muted hover:text-danger">
                  <LinkSimple size={14} weight="bold" />
                  Unlink
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-hairline text-center">
                  <NavigationArrow
                    size={28}
                    weight="thin"
                    className="mb-2 text-muted opacity-50"
                  />
                  <p className="text-[11px] font-bold text-muted ">
                    No GPS device linked
                  </p>
                </div>
                <button
                  onClick={() => {
                    // In production: open GPS linking flow
                    toast.info(
                      "GPS linking will be available in the next update",
                    );
                  }}
                  className="btn btn-secondary w-full h-10 text-[11px] font-semibold "
                >
                  <LinkSimple size={16} weight="bold" />
                  Link GPS Device
                </button>
              </div>
            )}
          </div>

          {/* Trailer */}
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <Cube size={22} weight="bold" className="text-primary" />
              Trailer
            </h3>
            {truck.trailerId ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-soft/50 border border-hairline/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft text-primary">
                    <Cube size={20} weight="bold" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {truck.trailerInfo || "Trailer linked"}
                    </div>
                    <div className="text-[10px] font-bold text-muted ">
                      ID: {truck.trailerId.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-hairline text-center">
                <Cube
                  size={28}
                  weight="thin"
                  className="mb-2 text-muted opacity-50"
                />
                <p className="text-[11px] font-bold text-muted ">
                  No trailer linked
                </p>
              </div>
            )}
          </div>

          {/* Management Actions */}
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <Warning size={22} weight="bold" className="text-danger" />
              Management
            </h3>
            <div className="space-y-4">
              <button
                onClick={handleDeactivate}
                className={cn(
                  "btn w-full h-11 text-xs font-bold transition-all",
                  truck.status === "disabled" 
                    ? "btn-secondary text-primary" 
                    : "btn-secondary text-amber-600 hover:text-amber-700"
                )}
              >
                {truck.status === "disabled" ? (
                  <><CheckCircle size={18} weight="bold" /> Activate Truck</>
                ) : (
                  <><Prohibit size={18} weight="bold" /> Deactivate Truck</>
                )}
              </button>
              
              <button
                onClick={handleRemoveTruck}
                className="btn btn-ghost-danger w-full h-11 text-xs font-bold"
              >
                <Trash size={18} weight="bold" />
                Remove from Fleet
              </button>
            </div>
          </div>
        </div>

        {/* compliance section — only shown if driver assigned */}
        {truck.assignedDriverId && (driver || isLoadingDriver) && (
          <div className="rounded-3xl border border-hairline bg-card p-8 shadow-xl mb-8">
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
              <CalendarCheck size={22} weight="bold" className="text-primary" />
              Compliance
            </h3>

            {isLoadingDriver ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted/20 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : driver ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CDL */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl p-5 border",
                    cdlDaysLeft != null && cdlDaysLeft <= 30
                      ? "border-danger/20 bg-danger-light/30"
                      : "border-hairline/50 bg-surface-soft/30",
                  )}
                >
                  <div>
                    <div className="text-[10px] font-semibold  text-muted mb-1">
                      CDL Expiry
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {driver.cdlExpiry
                        ? new Date(driver.cdlExpiry).toLocaleDateString()
                        : "Not on file"}
                    </div>
                  </div>
                  {cdlDaysLeft != null && (
                    <span
                      className={cn(
                        "badge",
                        cdlDaysLeft <= 7
                          ? "badge-red"
                          : cdlDaysLeft <= 30
                            ? "badge-amber"
                            : "badge-green",
                      )}
                    >
                      {cdlDaysLeft > 0 ? `${cdlDaysLeft} days` : "Expired"}
                    </span>
                  )}
                  {driver.cdlNumber && (
                    <div className="text-[10px] font-mono font-bold text-muted uppercase">
                      {driver.cdlNumber}
                    </div>
                  )}
                </div>

                {/* Medical Card */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl p-5 border",
                    medDaysLeft != null && medDaysLeft <= 30
                      ? "border-danger/20 bg-danger-light/30"
                      : "border-hairline/50 bg-surface-soft/30",
                  )}
                >
                  <div>
                    <div className="text-[10px] font-semibold  text-muted mb-1">
                      Medical Card Expiry
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {driver.medicalCardExpiry
                        ? new Date(
                            driver.medicalCardExpiry,
                          ).toLocaleDateString()
                        : "Not on file"}
                    </div>
                  </div>
                  {medDaysLeft != null && (
                    <span
                      className={cn(
                        "badge",
                        medDaysLeft <= 7
                          ? "badge-red"
                          : medDaysLeft <= 30
                            ? "badge-amber"
                            : "badge-green",
                      )}
                    >
                      {medDaysLeft > 0 ? `${medDaysLeft} days` : "Expired"}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted">
                <Warning size={32} weight="thin" className="mb-2 opacity-40" />
                <p className="text-xs font-bold ">
                  No compliance data available
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── assign driver modal ──────────────────────────────────────────────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-[2rem] border border-hairline shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-hairline bg-muted/5">
              <div>
                <h2 className="text-2xl font-semibold text-ink">
                  Assign Driver
                </h2>
                <p className="text-xs font-bold text-muted  mt-1">
                  For {truck.make} {truck.model} (
                  {truck.internalId || truck._id.slice(-6)})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-card border border-hairline text-muted hover:bg-danger hover:text-white hover:border-danger transition-all"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-semibold  text-muted">
                  Select Driver
                </label>
                {isFetchingDrivers ? (
                  <div className="flex items-center justify-center p-4 gap-2 text-sm font-bold text-muted">
                    <Spinner size={20} weight="bold" className="animate-spin" />
                    Loading drivers...
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="p-4 text-center text-sm font-bold text-muted border border-dashed rounded-2xl">
                    No drivers available in your team.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full rounded-2xl border border-hairline bg-surface-soft px-5 py-4 text-sm font-semibold text-ink outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose a driver...
                    </option>
                    {availableDrivers.map((d) => (
                      <option key={d.userId} value={d.userId}>
                        {d.profile.firstName} {d.profile.lastName} (
                        {d.profile.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 btn btn-secondary h-12 text-[11px] font-semibold "
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={isAssigning || !selectedDriverId}
                  className="flex-1 btn btn-primary h-12 text-[11px] font-semibold  shadow-xl "
                >
                  {isAssigning ? "Assigning..." : "Assign to Truck"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
