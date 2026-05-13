"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { LoadTableRow } from "@/components/marketplace/LoadTableRow";
import { LoadExpandedDetails } from "@/components/marketplace/LoadExpandedDetails";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Load {
  _id: string;
  origin: { city: string; state: string; zip?: string };
  destination: { city: string; state: string; zip?: string };
  rate: number;
  pickupDate: string;
  deliveryDate?: string;
  truckType: string;
  estimatedDistance: number;
  commodity: string;
  weight: number;
  createdAt?: string;
  status?: string;
}

interface Filters {
  origin: string;
  destination: string;
  equipmentType: string;
  minRate: string;
  maxRate: string;
}

function formatAge(createdAt?: string): string {
  if (!createdAt) return "--";
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatPickup(dateStr?: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MarketplacePage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);
  const [bookingLoadId, setBookingLoadId] = useState<string | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);

  const fetchLoads = useCallback(async (filters?: Filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (filters) {
        if (filters.origin) params.originCity = filters.origin;
        if (filters.destination) params.destCity = filters.destination;
        if (filters.equipmentType) params.truckType = filters.equipmentType;
        if (filters.minRate) params.minRate = Number(filters.minRate);
        if (filters.maxRate) params.maxRate = Number(filters.maxRate);
      }
      const response = await api.get("/marketplace/loads", { params });
      setLoads(response.data?.data?.loads ?? []);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to fetch loads";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const handleBookClick = (loadId: string) => {
    setBookingLoadId(loadId);
    setShowBookDialog(true);
  };

  const [bookingTruckId, setBookingTruckId] = useState("");
  const [bookingDriverId, setBookingDriverId] = useState("");

  const handleConfirmBook = async () => {
    if (!bookingLoadId) return;
    try {
      const body: Record<string, string> = {};
      if (bookingTruckId) body.truckId = bookingTruckId;
      if (bookingDriverId) body.driverId = bookingDriverId;
      const response = await api.post(`/loads/${bookingLoadId}/booking-request`, body);
      if (response.data.success) {
        toast.success("Booking request sent successfully!");
        setExpandedLoadId(null);
        fetchLoads();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to send booking request";
      toast.error(msg);
    } finally {
      setShowBookDialog(false);
      setBookingLoadId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-canvas overflow-hidden">
      <MarketplaceFilters onSearch={fetchLoads} isLoading={isLoading} />

      {/* Results Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-hairline bg-canvas shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchLoads()}
            className="flex items-center gap-2 text-muted hover:text-ink transition-colors"
          >
            <ArrowClockwise size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
          <h3 className="text-[20px] font-semibold text-ink tracking-tight leading-none">
            Available Loads <span className="text-muted font-normal ml-2 text-[16px]">({loads.length})</span>
          </h3>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center h-12 px-6 bg-surface-soft border-b border-hairline text-[11px] font-semibold text-muted shrink-0 uppercase tracking-wider">
        <div className="w-14">Age</div>
        <div className="w-24">Rate</div>
        <div className="w-16">Trip</div>
        <div className="w-44">Origin</div>
        <div className="w-10" />
        <div className="w-44">Destination</div>
        <div className="w-24">Pick Up</div>
        <div className="flex-1 min-w-[160px]">Equipment</div>
        <div className="w-24" />
      </div>

      {/* Load List */}
      <div className="flex-1 overflow-y-auto bg-canvas">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-14 bg-canvas border-b border-hairline animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted bg-canvas">
            <Warning size={48} weight="thin" className="mb-4 opacity-30 text-error" />
            <p className="text-[16px] font-medium">{error}</p>
            <button
              onClick={() => fetchLoads()}
              className="mt-6 h-10 px-6 border border-hairline rounded-md text-[14px] font-semibold hover:bg-surface-soft transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : loads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted bg-canvas">
            <Package size={64} weight="thin" className="mb-6 opacity-20" />
            <h3 className="text-xl font-semibold text-ink mb-2">No loads available</h3>
            <p className="text-[14px] font-medium">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          loads.map((load) => {
            const isExpanded = expandedLoadId === load._id;
            return (
              <React.Fragment key={load._id}>
                <LoadTableRow
                  load={{
                    _id: load._id,
                    age: formatAge(load.createdAt),
                    rate: load.rate,
                    trip: load.estimatedDistance || 0,
                    origin: load.origin,
                    destination: load.destination,
                    pickup: formatPickup(load.pickupDate),
                    equipment: load.truckType,
                    weight: `${load.weight.toLocaleString()} lbs`,
                    commodity: load.commodity,
                  }}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedLoadId(isExpanded ? null : load._id)}
                  onBook={() => handleBookClick(load._id)}
                />
                {isExpanded && (
                  <LoadExpandedDetails
                    load={{
                      _id: load._id,
                      origin: load.origin,
                      destination: load.destination,
                      trip: load.estimatedDistance || 0,
                      rate: load.rate,
                      pickupDate: load.pickupDate,
                      deliveryDate: load.deliveryDate,
                      equipment: {
                        load: "Full",
                        truck: load.truckType,
                        weight: `${load.weight.toLocaleString()} lbs`,
                        commodity: load.commodity || "General Freight",
                        refId: load._id.slice(-8).toUpperCase(),
                      },
                    }}
                    onBook={() => handleBookClick(load._id)}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-ink">Confirm Booking Request</DialogTitle>
            <DialogDescription className="text-sm text-muted">
              Are you sure you want to send a booking request for this load? The broker will review and confirm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBook} className="bg-primary text-primary-foreground hover:bg-primary-active">
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
