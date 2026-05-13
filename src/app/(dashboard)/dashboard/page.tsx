"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  ClipboardText,
  CurrencyDollar,
  MapPin,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import api from "@/lib/axios";

interface LoadRecord {
  _id: string;
  status?: string;
  origin?: { city?: string; state?: string };
  destination?: { city?: string; state?: string };
  truckType?: string;
  rate?: number;
  pickupDate?: string;
}

interface LoadSummary {
  active: number;
  posted: number;
  booked: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isBroker = user?.role === "broker";
  const [summary, setSummary] = useState<LoadSummary>({
    active: 0,
    posted: 0,
    booked: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [recentLoads, setRecentLoads] = useState<LoadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/loads?limit=50");
        const rawData = res?.data?.data;
        const loads: LoadRecord[] = Array.isArray(rawData?.loads)
          ? rawData.loads
          : Array.isArray(rawData)
            ? rawData
            : [];

        const counts: LoadSummary = {
          active: 0,
          posted: 0,
          booked: 0,
          inTransit: 0,
          delivered: 0,
          cancelled: 0,
        };

        for (const l of loads) {
          const status = l?.status;
          if (!status) continue;
          switch (status) {
            case "posted":
            case "active":
              counts.posted++;
              break;
            case "booked":
              counts.booked++;
              break;
            case "in_transit":
            case "in-transit":
              counts.inTransit++;
              break;
            case "delivered":
              counts.delivered++;
              break;
            case "cancelled":
              counts.cancelled++;
              break;
          }
        }
        counts.active = counts.posted + counts.booked + counts.inTransit;
        setSummary(counts);
        setRecentLoads(loads.slice(0, 8));
      } catch {
        // defaults
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const colorMap: Record<string, string> = {
    accent: "bg-surface-soft text-ink",
    amber: "bg-surface-soft text-ink",
    green: "bg-surface-soft text-ink",
    indigo: "bg-surface-soft text-ink",
  };

  const statusBadge: Record<string, string> = {
    posted: "badge-pill badge-pill-default",
    booked: "badge-pill badge-pill-violet",
    in_transit: "badge-pill badge-pill-orange",
    delivered: "badge-pill badge-pill-emerald",
    cancelled: "badge-pill badge-pill-pink",
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-canvas min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Welcome back, {user?.firstName}</p>
        </div>
        {isBroker && (
          <button
            onClick={() => router.push("/loads/create")}
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary-active transition-colors"
          >
            <Plus size={18} /> Post New Load
          </button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            value: summary.active,
            label: "Active Loads",
            Icon: Truck,
            color: "accent",
          },
          {
            value: summary.booked,
            label: "Booked",
            Icon: ClipboardText,
            color: "amber",
          },
          {
            value: summary.inTransit,
            label: "In Transit",
            Icon: MapPin,
            color: "indigo",
          },
          {
            value: summary.delivered,
            label: "Delivered",
            Icon: CurrencyDollar,
            color: "green",
          },
        ].map(({ value, label, Icon, color }) => (
          <div
            key={label}
            className="flex items-start gap-3.5 rounded-xl border border-hairline bg-card p-5"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                colorMap[color],
              )}
            >
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-ink">
                {value}
              </div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="rounded-xl border border-hairline bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h3 className="text-base font-semibold text-ink">
              Recent Loads
            </h3>
            <button
              onClick={() => router.push("/loads")}
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              View All
            </button>
          </div>
          {recentLoads.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted">
              No loads yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase text-muted">
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Equipment</th>
                  <th className="px-5 py-3">Rate</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLoads.map((load: LoadRecord) => (
                  <tr
                    key={load._id}
                    className="border-t border-hairline hover:bg-surface-soft cursor-pointer transition-colors"
                    onClick={() => router.push(`/loads/${load._id}`)}
                  >
                    <td className="px-5 py-3 text-sm text-body-text">
                      {load.origin?.city} &rarr; {load.destination?.city}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge-pill badge-pill-default">
                        {load.truckType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-ink">
                      ${load.rate?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          load.status ? statusBadge[load.status] || "" : "",
                        )}
                      >
                        {load.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-hairline bg-card p-5">
            <h3 className="mb-4 text-base font-semibold text-ink">
              Quick Stats
            </h3>
            <div className="space-y-2">
              {[
                { label: "Posted", value: summary.posted, color: "bg-blue-500" },
                { label: "Booked", value: summary.booked, color: "bg-indigo-500" },
                {
                  label: "In Transit",
                  value: summary.inTransit,
                  color: "bg-orange-500",
                },
                {
                  label: "Delivered",
                  value: summary.delivered,
                  color: "bg-emerald-500",
                },
                {
                  label: "Cancelled",
                  value: summary.cancelled,
                  color: "bg-rose-500",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg bg-surface-soft px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", color)} />
                    <span className="text-sm font-medium text-ink">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
