"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Plus,
  MagnifyingGlass,
  User,
  Cube,
  ArrowClockwise,
  Warning,
  CaretRight,
  IdentificationBadge,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import Link from "next/link";

// ──────────────────────────────────────────────────── types ────────────────────────────────────────────────────

interface Vehicle {
  _id: string;
  vin: string;
  plateNumber: string;
  plateState: string;
  internalId: string;
  status: "available" | "in_transit" | "booked" | "disabled";
  type: string;
  make: string;
  model: string;
  year: number;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
}

interface DriverInfo {
  _id: string;
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
  };
  role: { name: string };
}

interface ComplianceRow {
  _id: string;
  driverName: string;
  cdlExpiry: string;
  medicalCardExpiry: string;
  daysRemaining: number;
}

// ─────────────────────────────────────────────────── helpers ───────────────────────────────────────────────────

function maskVin(vin: string | undefined | null): string {
  if (!vin) return "N/A";
  if (vin.length <= 11) return vin + "***";
  return vin.slice(0, 11) + "***";
}

function statusBadge(status: string) {
  switch (status) {
    case "available":
      return "badge-pill badge-pill-green";
    case "in_transit":
      return "badge-pill badge-pill-amber";
    case "booked":
      return "badge-pill badge-pill-indigo";
    case "disabled":
      return "badge-pill badge-pill-gray";
    default:
      return "badge-pill badge-pill-muted";
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

// ──────────────────────────────────────────────── fleet overview page ──────────────────────────────────────────

export default function FleetOverviewPage() {
  const router = useRouter();

  // tabs
  const [activeTab, setActiveTab] = useState<
    "Vehicles" | "Drivers" | "Trailer"
  >("Vehicles");

  // vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // drivers list (for Drivers tab)
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  // compliance data (for Drivers tab)
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(true);

  // trailers list
  const [trailers, setTrailers] = useState<any[]>([]);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(true);

  // ── fetch functions ──────────────────────────────────────────────────────────────────────

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await api.get("/fleet/trucks");
      const data = response.data?.data?.trucks ?? response.data?.data ?? [];
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to load fleet data",
      );
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await api.get("/teams/members?role=driver");
      setDrivers(response.data?.data ?? []);
    } catch {
      // silent — Drivers tab may be empty
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchCompliance = async () => {
    setIsLoadingCompliance(true);
    try {
      const response = await api.get("/fleet/compliance?daysAhead=30");
      setCompliance(response.data?.data ?? []);
    } catch {
      // silent
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const fetchTrailers = async () => {
    setIsLoadingTrailers(true);
    try {
      const response = await api.get("/fleet/trailers");
      const data = response.data?.data ?? [];
      setTrailers(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setIsLoadingTrailers(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchCompliance();
  }, []);

  useEffect(() => {
    if (activeTab === "Drivers") {
      fetchDrivers();
    } else if (activeTab === "Trailer") {
      fetchTrailers();
    }
  }, [activeTab]);

  // ── filtered vehicles ───────────────────────────────────────────────────────────────────

  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.internalId?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.plateNumber?.toLowerCase().includes(q),
    );
  }, [vehicles, searchQuery]);

  // ── compliance alert mapping ────────────────────────────────────────────────────────────

  const getComplianceAlert = (
    vehicle: Vehicle,
  ): { type: "expired" | "expiring" | null; label: string } | null => {
    if (!vehicle.assignedDriverId) return null;

    const driverCompliance = compliance.find(
      (c) => c.driverName === vehicle.assignedDriverName,
    );
    if (!driverCompliance) return null;

    if (driverCompliance.daysRemaining <= 0) {
      return { type: "expired", label: "Doc Expired" };
    }
    if (driverCompliance.daysRemaining <= 30) {
      return {
        type: "expiring",
        label: `Expires in ${driverCompliance.daysRemaining}d`,
      };
    }
    return null;
  };

  // ── quick assign handler ─────────────────────────────────────────────────────────────────

  const handleQuickAssign = async (vehicle: Vehicle) => {
    // For available vehicles without a driver - quick assign flow
    // In a full implementation this would open a driver selection modal
    router.push(`/fleet/${vehicle._id}`);
  };

  // ── render ───────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── page header ────────────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Fleet
          </h1>
          <p className="text-sm font-bold text-muted  mt-1">
            Manage your trucks, trailers, and drivers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchVehicles}
            disabled={isLoadingVehicles}
            className="btn btn-secondary h-12 w-12 shadow-sm"
            title="Refresh"
          >
            <ArrowClockwise
              size={20}
              weight="bold"
              className={isLoadingVehicles ? "animate-spin" : ""}
            />
          </button>
          <Link
            href="/fleet/add"
            className="btn btn-primary h-12 px-6 shadow-sm"
          >
            <Plus size={20} weight="bold" />
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* ── search bar ─────────────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="relative max-w-[400px]">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Internal ID, VIN, or License Plate"
            className="w-full rounded-md border border-hairline bg-card py-3.5 pl-12 pr-5 text-[13px] font-medium text-ink placeholder:text-muted outline-none transition-all focus:border-primary focus:ring-1 focus:ring-ink"
          />
        </div>
      </div>

      {/* ── tabs ────────────────────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-2">
        {[
          { label: "Vehicles" as const, icon: Truck },
          { label: "Drivers" as const, icon: User },
          { label: "Trailer" as const, icon: Cube },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-[11px] font-semibold  rounded-md border transition-all",
              activeTab === label
                ? "bg-primary border-primary text-white shadow-sm"
                : "bg-card border-hairline text-muted hover:border-muted hover:text-ink",
            )}
          >
            <Icon size={18} weight={activeTab === label ? "bold" : "regular"} />
            {label}
          </button>
        ))}
      </div>

      {/* ── tab content ─────────────────────────────────────────────────────────────────── */}

      {/* ─── Vehicles Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "Vehicles" && (
        <>
          {isLoadingVehicles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl border border-hairline bg-card animate-pulse"
                />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted">
              <Cube size={48} weight="thin" className="mb-4 opacity-40" />
              <p className="text-sm font-bold ">
                {searchQuery
                  ? "No vehicles match your search"
                  : "No vehicles in fleet yet"}
              </p>
              {!searchQuery && (
                <Link href="/fleet/add" className="btn btn-primary mt-6 px-6">
                  <Plus size={18} weight="bold" />
                  Add Your First Vehicle
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="group rounded-xl border border-hairline bg-card p-6 shadow-xl transition-all hover:border-ink hover:-translate-y-1"
                >
                  {/* top row: truck icon + id + status */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          vehicle.status === "available"
                            ? "bg-success-light text-success"
                            : vehicle.status === "disabled"
                              ? "bg-muted/10 text-muted"
                              : "bg-surface-soft text-ink",
                        )}
                      >
                        <Truck size={22} weight="bold" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-ink tracking-tight">
                          {vehicle.internalId ||
                            vehicle._id.slice(-6).toUpperCase()}
                        </div>
                        <div className=" font-bold text-muted ">
                          VIN: {maskVin(vehicle.vin)}
                        </div>
                      </div>
                    </div>
                    <span className={cn("badge", statusBadge(vehicle.status))}>
                      {statusLabel(vehicle.status)}
                    </span>
                  </div>

                  {/* compliance alert badge */}
                  {(() => {
                    const alert = getComplianceAlert(vehicle);
                    if (!alert) return null;
                    return (
                      <div className="mb-4 flex justify-end">
                        <span
                          className={cn(
                            "badge  font-semibold ",
                            alert.type === "expired"
                              ? "badge-pill badge-pill-red"
                              : "badge-pill badge-pill-amber",
                          )}
                        >
                          <Warning size={12} weight="bold" className="mr-1" />
                          {alert.label}
                        </span>
                      </div>
                    );
                  })()}

                  {/* type + year/make/model */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="badge badge-pill badge-pill-blue">
                      {vehicle.type?.replace(/_/g, " ") || "N/A"}
                    </span>
                    <span className="text-[11px] font-medium text-muted">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                  </div>

                  {/* driver info */}
                  <div className="flex items-center justify-between rounded-xl bg-surface-soft/50 border border-hairline/50 px-4 py-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-hairline text-muted">
                        <IdentificationBadge size={16} weight="bold" />
                      </div>
                      <div>
                        <div className=" font-semibold  text-muted mb-0.5">
                          Driver
                        </div>
                        <div
                          className={cn(
                            "text-[13px] font-semibold",
                            vehicle.assignedDriverId
                              ? "text-ink"
                              : "text-muted italic",
                          )}
                        >
                          {vehicle.assignedDriverName || "Unassigned"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/fleet/${vehicle._id}`)}
                      className="btn btn-secondary flex-1 h-10 text-[11px] font-semibold "
                    >
                      Details
                    </button>
                    {vehicle.status === "available" &&
                    !vehicle.assignedDriverId ? (
                      <button
                        onClick={() => handleQuickAssign(vehicle)}
                        className="btn btn-primary flex-1 h-10 text-[11px] font-semibold  shadow-sm"
                      >
                        Assign
                      </button>
                    ) : vehicle.status === "disabled" ? (
                      <button className="btn btn-secondary flex-1 h-10 text-[11px] font-semibold ">
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/fleet/${vehicle._id}`)}
                        className="btn btn-secondary flex-1 h-10 text-[11px] font-semibold "
                      >
                        <CaretRight size={14} weight="bold" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* add-vehicle placeholder card */}
              <Link
                href="/fleet/add"
                className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-hairline bg-muted/5 p-6 transition-all hover:border-ink hover:bg-primary/5 group"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-hairline text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                  <Plus size={32} weight="bold" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-ink">
                    Add New Vehicle
                  </div>
                  <p className="text-[11px] font-bold text-muted  mt-1">
                    Register truck or trailer
                  </p>
                </div>
              </Link>
            </div>
          )}
        </>
      )}

      {/* ─── Drivers Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "Drivers" && (
        <div className="space-y-8">
          {/* driver roster cards */}
          {isLoadingDrivers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-hairline bg-card animate-pulse"
                />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted">
              <User size={40} weight="thin" className="mb-3 opacity-40" />
              <p className="text-sm font-bold ">
                No drivers in team yet
              </p>
              <p className="text-xs text-muted mt-1">
                Invite drivers from the Team settings page
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <div
                  key={d.userId}
                  className="flex items-center gap-4 rounded-xl border border-hairline bg-card p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-soft text-ink text-sm font-semibold">
                    {d.profile.firstName?.[0]}
                    {d.profile.lastName?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {d.profile.firstName} {d.profile.lastName}
                    </div>
                    <div className="text-[11px] font-medium text-muted">
                      {d.profile.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* compliance table */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-ink mb-4">
              Compliance — Document Expiry
            </h3>
            {isLoadingCompliance ? (
              <div className="rounded-xl border border-hairline bg-card overflow-hidden">
                <div className="divide-y divide-hairline">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="px-6 py-5 animate-pulse bg-card/50"
                    />
                  ))}
                </div>
              </div>
            ) : compliance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-hairline bg-card text-muted">
                <Warning size={32} weight="thin" className="mb-2 opacity-40" />
                <p className="text-xs font-bold ">
                  All documents are up to date
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-hairline bg-muted/30">
                        <th className="px-6 py-4  font-semibold  text-muted">
                          Driver Name
                        </th>
                        <th className="px-6 py-4  font-semibold  text-muted">
                          CDL Expiry
                        </th>
                        <th className="px-6 py-4  font-semibold  text-muted">
                          Medical Card Expiry
                        </th>
                        <th className="px-6 py-4  font-semibold  text-muted">
                          Days Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {compliance.map((row) => (
                        <tr
                          key={row._id}
                          className="group hover:bg-surface-soft transition-colors"
                        >
                          <td className="px-6 py-4 text-[13px] font-semibold text-ink">
                            {row.driverName}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium text-muted">
                            {new Date(row.cdlExpiry).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium text-muted">
                            {new Date(
                              row.medicalCardExpiry,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "badge",
                                row.daysRemaining <= 7
                                  ? "badge-pill badge-pill-red"
                                  : row.daysRemaining <= 30
                                    ? "badge-pill badge-pill-amber"
                                    : "badge-pill badge-pill-green",
                              )}
                            >
                              {row.daysRemaining} days
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Trailer Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "Trailer" && (
        <>
          {isLoadingTrailers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl border border-hairline bg-card animate-pulse"
                />
              ))}
            </div>
          ) : trailers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted">
              <Cube size={48} weight="thin" className="mb-4 opacity-40" />
              <p className="text-sm font-bold ">No trailers in fleet yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trailers.map((t) => (
                <div
                  key={t._id}
                  className="rounded-xl border border-hairline bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-soft text-ink">
                      <Cube size={22} weight="bold" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">
                        {t.internalId || t._id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-[11px] text-muted">
                        {t.year} {t.make} {t.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-pill badge-pill-blue">
                      {t.type}
                    </span>
                    <span className="badge badge-pill badge-pill-default">
                      {t.length}ft
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
