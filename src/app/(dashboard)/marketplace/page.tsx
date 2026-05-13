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
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
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
  origin?: string;
  originLat?: number | null;
  originLng?: number | null;
  originRadius?: number;
  destination?: string;
  destLat?: number | null;
  destLng?: number | null;
  destRadius?: number;
  equipmentType?: string;
  minRate?: string;
  maxRate?: string;
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
        if (filters.originLat) params.originLat = filters.originLat;
        if (filters.originLng) params.originLng = filters.originLng;
        if (filters.originRadius !== undefined) params.originRadius = filters.originRadius;
        
        if (filters.destLat) params.destLat = filters.destLat;
        if (filters.destLng) params.destLng = filters.destLng;
        if (filters.destRadius !== undefined) params.destRadius = filters.destRadius;

        // Fallback to text search if no coordinates
        if (!filters.originLat && filters.origin) params.originCity = filters.origin;
        if (!filters.destLat && filters.destination) params.destCity = filters.destination;

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

  const { user } = useAppSelector((state) => state.auth);
  const isCarrier = user?.role === "carrier";
  const isIndependentDriver = user?.role === "independent_driver";

  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);

  useEffect(() => {
    if ((isCarrier || isIndependentDriver) && showBookDialog) {
      const fetchFleet = async () => {
        setIsLoadingFleet(true);
        try {
          const [trucksRes, driversRes] = await Promise.all([
            api.get("/fleet/trucks"),
            isCarrier ? api.get("/teams/members?role=driver") : Promise.resolve({ data: { data: [] } })
          ]);
          
          const truckList = trucksRes.data?.data?.trucks || trucksRes.data?.data || [];
          setTrucks(truckList);

          if (isCarrier) {
            setDrivers(driversRes.data?.data || []);
          }

          // Auto-select for independent driver
          if (truckList.length === 1) {
            const firstTruckId = truckList[0]._id || truckList[0].id;
            if (firstTruckId && firstTruckId !== 'undefined') {
              setBookingTruckId(firstTruckId);
            }
          }
          if (isIndependentDriver) {
            setBookingDriverId(user?.id || "");
          }
        } catch (err) {
          console.error("Failed to fetch fleet data", err);
        } finally {
          setIsLoadingFleet(false);
        }
      };
      fetchFleet();
    }
  }, [isCarrier, isIndependentDriver, showBookDialog, user?.id]);

  const handleBookClick = (load: any) => {
    setBookingLoadId(load._id);
    setBookingProposedRate(load.rate || 0);
    setShowBookDialog(true);
  };

  const [bookingTruckId, setBookingTruckId] = useState("");
  const [bookingDriverId, setBookingDriverId] = useState("");
  const [bookingProposedRate, setBookingProposedRate] = useState<number>(0);

  const handleConfirmBook = async () => {
    if (!bookingLoadId) return;
    try {
      const body: Record<string, string> = {};
      if (!bookingTruckId || bookingTruckId === 'undefined') {
        toast.error("Please select a valid truck");
        return;
      }
      if (!bookingDriverId && !isIndependentDriver) {
        toast.error("Please select a driver");
        return;
      }
      body.truckId = bookingTruckId;
      body.driverId = isIndependentDriver ? user!.id : bookingDriverId;
      body.proposedRate = bookingProposedRate.toString();
      
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
                  onBook={() => handleBookClick(load)}
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
                    onBook={() => handleBookClick(load)}
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

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink flex items-center gap-1">
                Select Truck <span className="text-error">*</span>
              </label>
              <select
                className="w-full h-10 rounded-md border border-hairline bg-surface-soft px-3 text-sm font-medium outline-none focus:border-primary transition-all"
                value={bookingTruckId}
                onChange={(e) => setBookingTruckId(e.target.value)}
              >
                <option value="">Select a truck...</option>
                {trucks.map(t => {
                  const tid = t._id || t.id;
                  return (
                    <option key={tid} value={tid}>
                      {t.internalId || t.plateNumber} ({t.type})
                    </option>
                  );
                })}
              </select>
              {trucks.length === 0 && (
                <p className="text-[11px] font-bold text-error bg-error/10 p-2 rounded mt-2">
                  You have no trucks. Please <Link href="/fleet/add" className="underline">register a truck</Link> first.
                </p>
              )}
            </div>

            {isCarrier && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-ink flex items-center gap-1">
                  Assign Driver <span className="text-error">*</span>
                </label>
                <select
                  className="w-full h-10 rounded-md border border-hairline bg-surface-soft px-3 text-sm font-medium outline-none focus:border-primary transition-all"
                  value={bookingDriverId}
                  onChange={(e) => setBookingDriverId(e.target.value)}
                >
                  <option value="">Select a driver...</option>
                  {drivers.map(d => (
                    <option key={d.userId} value={d.userId}>{d.profile.firstName} {d.profile.lastName}</option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-[11px] font-bold text-error bg-error/10 p-2 rounded mt-2">
                    No drivers available. Please <Link href="/teams" className="underline">add a driver</Link> to your team.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-ink flex items-center gap-1">
                Your Bid / Proposed Rate <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">$</span>
                <input
                  type="number"
                  className="w-full h-10 rounded-md border border-hairline bg-surface-soft pl-7 pr-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all"
                  value={bookingProposedRate}
                  onChange={(e) => setBookingProposedRate(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <p className="text-[11px] text-muted">
                Entering a rate here sends a counter-offer to the broker.
              </p>
            </div>
          </div>
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
