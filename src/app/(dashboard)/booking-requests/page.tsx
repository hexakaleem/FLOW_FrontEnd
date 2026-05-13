"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PaperPlaneTilt,
  Warning,
  CircleNotch,
  ArrowRight,
  CheckCircle,
  XCircle,
  CurrencyDollar,
  Truck,
  MapPin,
  Clock,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import PermissionGate from "@/components/PermissionGate";

interface BookingRequest {
  _id: string;
  loadId: string;
  carrierOrgId: string;
  carrierUserId: string;
  proposedRate: number | null;
  status: string;
  createdAt: string;
  load: {
    _id: string;
    title: string;
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    status: string;
    rate: number;
  };
}

export default function BookingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/loads/booking-requests/pending");
      setRequests(res.data?.data || []);
    } catch (err: any) {
      toast.error("Failed to fetch booking requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (loadId: string, requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/loads/${loadId}/booking-confirm`, { requestId });
      toast.success("Booking confirmed!");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to confirm booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (loadId: string, requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/loads/${loadId}/booking-deny`, { requestId });
      toast.success("Booking denied");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to deny booking");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PermissionGate roles={["broker"]}>
      <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink flex items-center gap-3">
            <PaperPlaneTilt size={32} weight="bold" className="text-primary" />
            Pending Bids & Requests
          </h1>
          <p className="text-sm font-semibold text-muted mt-1">
            Review and manage incoming booking requests from carriers across all your loads.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <CircleNotch size={48} weight="bold" className="animate-spin text-primary mb-4" />
            <p className="font-bold text-sm">Fetching pending requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-hairline bg-card p-24 text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-surface-soft flex items-center justify-center mb-6">
              <CheckCircle size={40} weight="duotone" className="text-muted opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">All caught up!</h3>
            <p className="text-sm font-semibold text-muted max-w-xs mx-auto">
              There are no pending booking requests right now. New bids will appear here as soon as carriers submit them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map((req) => (
              <div
                key={req._id}
                className="group relative rounded-2xl border border-hairline bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Load Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-surface-soft flex items-center justify-center text-primary">
                        <Truck size={24} weight="bold" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink">
                          {req.load?.origin?.city}, {req.load?.origin?.state} → {req.load?.destination?.city}, {req.load?.destination?.state}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                            FL-{req.loadId.slice(-6).toUpperCase()}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold text-primary">
                            Target: ${req.load?.rate?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Carrier Info */}
                    <div className="flex flex-wrap gap-6 pl-14">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-xs font-bold text-ink">Carrier #{req.carrierOrgId.slice(-4).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted">
                        <Clock size={16} weight="bold" />
                        <span className="text-xs font-bold">{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <CurrencyDollar size={18} weight="bold" />
                        <span className="text-sm font-black">
                          Bid: ${ (req.proposedRate || req.load?.rate || 0).toLocaleString() }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pl-14 md:pl-0">
                    <button
                      onClick={() => router.push(`/loads/${req.loadId}`)}
                      className="h-11 px-6 rounded-xl border border-hairline bg-white text-xs font-bold text-ink hover:bg-surface-soft transition-all"
                    >
                      View Load
                    </button>
                    <button
                      onClick={() => handleDeny(req.loadId, req._id)}
                      disabled={actionLoading === req._id}
                      className="h-11 w-11 rounded-xl border border-danger/20 text-danger hover:bg-danger/5 transition-all flex items-center justify-center"
                    >
                      {actionLoading === req._id ? (
                        <CircleNotch size={20} weight="bold" className="animate-spin" />
                      ) : (
                        <XCircle size={24} weight="bold" />
                      )}
                    </button>
                    <button
                      onClick={() => handleAccept(req.loadId, req._id)}
                      disabled={actionLoading === req._id}
                      className="h-11 px-8 rounded-xl bg-success text-white text-xs font-black shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                      {actionLoading === req._id ? (
                        <CircleNotch size={18} weight="bold" className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={20} weight="bold" />
                          Accept Bid
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
