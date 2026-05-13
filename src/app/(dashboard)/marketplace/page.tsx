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
    zip: "75201" // Mock
  },
  destination: { 
    city: load.destination.city, 
    state: load.destination.state, 
    dh: Math.floor(Math.random() * 50) + 5, // Mock
    zip: "76201" // Mock
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

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <MarketplaceFilters onSearch={fetchLoads} isLoading={isLoading} />

      {/* Results Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowClockwise size={18} className={isLoading ? "animate-spin" : ""} onClick={fetchLoads} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
              {loads.length} Results
              <span className="ml-3 text-[11px] font-bold text-dat-blue hover:underline cursor-pointer">
                +598 Similar Results
              </span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-bold text-dat-blue uppercase tracking-widest cursor-pointer group">
              Sort by Age - Newest
              <CaretDown size={12} weight="bold" className="group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] hover:text-dat-blue transition-colors flex items-center gap-2">
            $ LANE RATE
          </button>
          <button className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-dat-blue transition-colors flex items-center gap-2">
            :: TRI-HAUL <span className="text-[10px] font-medium text-slate-300">(NO ROUTES)</span>
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center h-10 px-4 bg-slate-50 border-b border-hairline text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
        <div className="w-8 flex justify-center mr-2">
          <input type="checkbox" className="rounded-sm border-slate-300" />
        </div>
        <div className="w-12">Age</div>
        <div className="w-20">Rate</div>
        <div className="w-16">Trip</div>
        <div className="w-40">Origin</div>
        <div className="w-12">DH-O</div>
        <div className="w-8" />
        <div className="w-40">Destination</div>
        <div className="w-12">DH-D</div>
        <div className="w-20">Pick Up</div>
        <div className="flex-1 min-w-[150px]">Equipment</div>
        <div className="w-40">Company</div>
        <div className="w-40">Contact</div>
        <div className="w-24 text-right">CS | DTP</div>
        <div className="w-20" />
      </div>

      {/* Load List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-white border-b border-hairline animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white">
            <Warning size={48} weight="thin" className="mb-4 opacity-20" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchLoads} className="mt-4 px-4 py-2 border border-hairline rounded text-xs font-bold hover:bg-slate-50">
              Retry
            </button>
          </div>
        ) : loads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white">
            <Package size={48} weight="thin" className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No loads found matching your criteria</p>
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
                />
                {isExpanded && (
                  <LoadExpandedDetails
                    load={{
                      ...uiLoad,
                      equipment: uiLoad.equipmentDetails,
                      broker: uiLoad.brokerDetails,
                    }}
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
