"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Warning,
  MagnifyingGlass,
  ArrowClockwise,
  List,
  CaretDown,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { LoadTableRow } from "@/components/marketplace/LoadTableRow";
import { LoadExpandedDetails } from "@/components/marketplace/LoadExpandedDetails";

interface Load {
  _id: string;
  origin: { city: string; state: string; dh?: number; zip?: string };
  destination: { city: string; state: string; dh?: number; zip?: string };
  rate: number;
  pickupDate: string;
  truckType: string;
  estimatedDistance: number;
  commodity: string;
  weight: number;
  broker?: {
    orgName: string;
    riskScore?: number;
  };
}

// Map real load data to UI components and inject mock data for missing fields
const mapLoadToUI = (load: Load) => ({
  _id: load._id,
  age: "5m", // Mock
  rate: load.rate,
  trip: load.estimatedDistance || 0,
  origin: { 
    city: load.origin.city, 
    state: load.origin.state, 
    dh: Math.floor(Math.random() * 50) + 10, // Mock
    zip: load.origin.zip || "75201" // Mock
  },
  destination: { 
    city: load.destination.city, 
    state: load.destination.state, 
    dh: Math.floor(Math.random() * 50) + 5, // Mock
    zip: load.destination.zip || "76201" // Mock
  },
  pickup: new Date(load.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  equipment: load.truckType,
  weight: `${load.weight.toLocaleString()} lbs`,
  length: "53 ft", // Mock
  company: load.broker?.orgName || "Unknown Broker",
  contact: "(555) 555-5500", // Mock
  creditScore: load.broker?.riskScore || 95,
  daysToPay: 19, // Mock
  equipmentDetails: {
    load: "Full",
    truck: load.truckType,
    length: "53 ft",
    weight: `${load.weight.toLocaleString()} lbs`,
    commodity: load.commodity || "General Freight",
    refId: load._id.slice(-8).toUpperCase(),
  },
  brokerDetails: {
    name: load.broker?.orgName || "Unknown Broker",
    phone: "(555) 555-5500",
    mc: "MC#123456",
    creditScore: load.broker?.riskScore || 95,
    daysToPay: 19,
    rating: 4.5,
    location: "Niles, IL",
  }
});

export default function MarketplacePage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);

  const fetchLoads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/marketplace/loads", { params: { limit: 50 } });
      setLoads(response.data?.data?.loads ?? []);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to fetch loads";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBookLoad = async (loadId: string) => {
    try {
      const response = await api.post(`/loads/${loadId}/booking-request`);
      if (response.data.success) {
        toast.success("Booking request sent successfully!");
        setExpandedLoadId(null);
        fetchLoads();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to send booking request";
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  return (
    <div className="flex flex-col h-full bg-canvas overflow-hidden">
      <MarketplaceFilters onSearch={fetchLoads} isLoading={isLoading} />

      {/* Results Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-hairline bg-canvas shrink-0">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-ink transition-colors">
            <ArrowClockwise size={20} className={isLoading ? "animate-spin" : ""} onClick={fetchLoads} />
          </button>
          <div className="flex flex-col">
            <h3 className="text-[22px] font-semibold text-ink tracking-tight leading-none">
              Marketplace <span className="text-muted-foreground font-normal ml-2">({loads.length} loads available)</span>
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[13px] font-medium text-primary hover:underline cursor-pointer group">
              Newest loads first
              <CaretDown size={14} weight="bold" className="group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button className="text-[13px] font-semibold text-ink uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
            $ Analyze Lane Rates
          </button>
        </div>
      </div>

      {/* Table Header — Styled as Cal.com product UI fragment */}
      <div className="flex items-center h-12 px-6 bg-surface-soft border-b border-hairline text-[11px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
        <div className="w-8 flex justify-center mr-3">
          <input type="checkbox" className="rounded-sm border-hairline" />
        </div>
        <div className="w-14">Age</div>
        <div className="w-24">Rate</div>
        <div className="w-16">Trip</div>
        <div className="w-44">Origin</div>
        <div className="w-10" />
        <div className="w-44">Destination</div>
        <div className="w-24">Pick Up</div>
        <div className="flex-1 min-w-[160px]">Equipment</div>
        <div className="w-48">Company</div>
        <div className="w-28 text-right">CS | DTP</div>
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
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-canvas">
            <Warning size={48} weight="thin" className="mb-4 opacity-30 text-error" />
            <p className="text-[16px] font-medium">{error}</p>
            <button onClick={fetchLoads} className="mt-6 h-10 px-6 border border-hairline rounded-md text-[14px] font-semibold hover:bg-surface-soft transition-all">
              Retry Connection
            </button>
          </div>
        ) : loads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-canvas">
            <Package size={64} weight="thin" className="mb-6 opacity-20" />
            <h3 className="text-xl font-semibold text-ink mb-2">No loads available</h3>
            <p className="text-[14px] font-medium">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          loads.map((load) => {
            const uiLoad = mapLoadToUI(load);
            const isExpanded = expandedLoadId === load._id;
            return (
              <React.Fragment key={load._id}>
                <LoadTableRow
                  load={uiLoad}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedLoadId(isExpanded ? null : load._id)}
                  onBook={() => handleBookLoad(load._id)}
                />
                {isExpanded && (
                  <LoadExpandedDetails
                    load={{
                      ...uiLoad,
                      equipment: uiLoad.equipmentDetails,
                      broker: uiLoad.brokerDetails,
                    }}
                    onBook={() => handleBookLoad(load._id)}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
