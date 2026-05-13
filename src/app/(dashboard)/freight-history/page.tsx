"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DotsThreeVertical,
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  Package,
  ClockCounterClockwise,
  MapPinLine,
  FlagCheckered,
  CalendarBlank,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Load {
  _id: string;
  origin: {
    city: string;
    state: string;
  };
  destination: {
    city: string;
    state: string;
  };
  truckType: string;
  rate: number;
  pickupDate: string;
  deliveryDate?: string;
  status: string;
  commodity?: string;
  weight?: number;
}

interface LoadsApiResponse {
  data?: {
    loads?: Load[];
    hasMore?: boolean;
    nextCursor?: string;
    total?: number;
  };
}

export default function FreightHistoryPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const cursorStackRef = useRef<string[]>([]);

  const fetchLoads = useCallback(
    async (pageCursor?: string | null) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          status: statusFilter === "all" ? "delivered,completed" : statusFilter,
          limit: 10,
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (equipmentFilter) {
          params.truckType = equipmentFilter;
        }

        if (pageCursor) {
          params.cursor = pageCursor;
        }

        const response = await api.get<LoadsApiResponse>("/loads", { params });
        const data = response.data?.data;
        const fetchedLoads: Load[] = Array.isArray(data?.loads)
          ? data.loads
          : Array.isArray(data)
            ? data
            : [];
        setLoads(fetchedLoads);
        setHasMore(data?.hasMore ?? false);
        setCursor(data?.nextCursor ?? null);
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message || "Failed to fetch freight history";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, equipmentFilter, statusFilter],
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchLoads(null);
      return;
    }
    setCurrentPage(1);
    cursorStackRef.current = [];
    fetchLoads(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, equipmentFilter, statusFilter]);

  const handleNextPage = () => {
    if (!hasMore || !cursor) return;
    cursorStackRef.current.push(cursor);
    setCurrentPage((prev) => prev + 1);
    fetchLoads(cursor);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    cursorStackRef.current.pop();
    const prevCursor =
      cursorStackRef.current.length > 0
        ? cursorStackRef.current[cursorStackRef.current.length - 1]
        : null;
    setCurrentPage((prev) => prev - 1);
    fetchLoads(prevCursor);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    cursorStackRef.current = [];
    fetchLoads(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered") return "badge-pill badge-pill-green";
    if (s === "completed") return "badge-pill badge-pill-green";
    if (s === "cancelled") return "badge-pill badge-pill-red";
    return "badge-pill badge-pill-gray";
  };

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClockCounterClockwise size={24} weight="bold" className="text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Freight History
            </h1>
          </div>
          <p className="text-sm font-bold text-muted mt-1">
            View your completed and delivered freight records
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary h-12 w-12 shadow-sm"
        >
          <ArrowClockwise
            size={20}
            weight="bold"
            className={isLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-hairline bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-success/10 rounded-md">
              <Package size={18} className="text-success" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Freight</span>
          </div>
          <p className="text-2xl font-bold text-ink">{loads.length}</p>
        </div>
        <div className="rounded-xl border border-hairline bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-success/10 rounded-md">
              <FlagCheckered size={18} className="text-success" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-success">
            {loads.filter((l) => l.status === "delivered").length}
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <CurrencyDollar size={18} className="text-primary" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-ink">
            ${loads.reduce((sum, l) => sum + (l.rate || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-amber/10 rounded-md">
              <CalendarBlank size={18} className="text-amber" weight="fill" />
            </div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Avg Rate</span>
          </div>
          <p className="text-2xl font-bold text-ink">
            ${loads.length > 0 ? Math.round(loads.reduce((sum, l) => sum + (l.rate || 0), 0) / loads.length).toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="w-full rounded-md border border-hairline bg-card px-11 py-3 text-[13px] font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-ink"
            placeholder="Search by Load ID, Origin, or Destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-12 w-48 rounded-md border border-hairline bg-card px-4 text-[13px] font-bold text-ink outline-none appearance-none cursor-pointer hover:border-muted transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="h-12 w-48 rounded-md border border-hairline bg-card px-4 text-[13px] font-bold text-ink outline-none appearance-none cursor-pointer hover:border-muted transition-colors"
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
        >
          <option value="">Equipment Type</option>
          <option value="Flatbed">Flatbed</option>
          <option value="Dry Van">Dry Van</option>
          <option value="Reefer">Reefer</option>
          <option value="Step Deck">Step Deck</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-hairline bg-card shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-muted/30">
                <th className="px-6 py-4 font-semibold text-muted">Load ID</th>
                <th className="px-6 py-4 font-semibold text-muted">Route</th>
                <th className="px-6 py-4 font-semibold text-muted">Equipment</th>
                <th className="px-6 py-4 font-semibold text-muted">Commodity</th>
                <th className="px-6 py-4 font-semibold text-muted">Rate</th>
                <th className="px-6 py-4 font-semibold text-muted">Pickup Date</th>
                <th className="px-6 py-4 font-semibold text-muted">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-6 py-8 bg-card/50" />
                    </tr>
                  ))
              ) : loads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-muted">
                    <Package size={48} weight="thin" className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-xs">No freight history found</p>
                    <p className="text-xs text-muted mt-1">Completed and delivered loads will appear here</p>
                  </td>
                </tr>
              ) : (
                loads.map((load) => (
                  <tr
                    key={load._id}
                    className="group hover:bg-surface-soft transition-colors cursor-pointer"
                    onClick={() => router.push(`/loads/${load._id}`)}
                  >
                    <td className="px-6 py-5 text-[13px] font-semibold text-ink">
                      {load._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <MapPinLine size={14} className="text-primary shrink-0" weight="fill" />
                        <span className="text-[13px] font-bold text-muted">
                          {load.origin.city}, {load.origin.state}
                        </span>
                        <ArrowRight size={14} className="text-muted shrink-0" weight="bold" />
                        <FlagCheckered size={14} className="text-success shrink-0" weight="fill" />
                        <span className="text-[13px] font-bold text-muted">
                          {load.destination.city}, {load.destination.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          "badge",
                          load.truckType === "Flatbed"
                            ? "badge-pill badge-pill-blue"
                            : load.truckType === "Reefer"
                              ? "badge-pill badge-pill-indigo"
                              : load.truckType === "Dry Van"
                                ? "badge-pill badge-pill-amber"
                                : "badge-pill badge-pill-gray",
                        )}
                      >
                        {load.truckType}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[13px] font-bold text-muted">
                      {load.commodity || "—"}
                    </td>
                    <td className="px-6 py-5 text-[13px] font-semibold text-ink">
                      ${load.rate.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-[13px] font-bold text-muted">
                      {new Date(load.pickupDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("badge", getStatusBadge(load.status))}>
                        {load.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:bg-muted/50 hover:text-ink transition-all">
                        <DotsThreeVertical size={20} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-hairline bg-muted/10 px-8 py-5">
          <span className="text-xs font-bold text-muted">
            Page {currentPage} — {loads.length} records
          </span>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary h-9 px-4 font-semibold disabled:opacity-30"
              disabled={currentPage <= 1}
              onClick={handlePrevPage}
            >
              <ArrowLeft size={14} weight="bold" />
              Prev
            </button>
            <button className="h-9 w-9 rounded-lg border text-xs font-semibold bg-primary border-primary text-white">
              {currentPage}
            </button>
            <button
              className="btn btn-secondary h-9 px-4 font-semibold disabled:opacity-30"
              disabled={!hasMore}
              onClick={handleNextPage}
            >
              Next
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
