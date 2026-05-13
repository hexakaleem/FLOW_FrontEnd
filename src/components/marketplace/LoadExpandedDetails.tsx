"use client";

import React from "react";
import {
  MapTrifold,
  Package,
} from "@phosphor-icons/react";

interface Load {
  _id: string;
  origin: { city: string; state: string; zip?: string };
  destination: { city: string; state: string; zip?: string };
  trip: number;
  rate: number;
  pickupDate: string;
  deliveryDate?: string;
  equipment: {
    load: string;
    truck: string;
    weight: string;
    commodity: string;
    refId: string;
  };
}

interface LoadExpandedDetailsProps {
  load: Load;
  onBook: () => void;
}

export function LoadExpandedDetails({ load, onBook }: LoadExpandedDetailsProps) {
  return (
    <div className="bg-canvas p-8 border-b border-hairline animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[36px] font-semibold text-ink leading-tight tracking-[-1px] flex items-center gap-4">
          {load.origin.city}
          <div className="flex items-center text-primary/20 text-2xl">→</div>
          {load.destination.city}
          <span className="text-muted-foreground font-normal text-xl ml-2">{load.trip} mi</span>
        </h2>
        <button className="flex items-center justify-center h-10 w-10 rounded-full border border-hairline text-ink hover:bg-surface-soft transition-all">
          <MapTrifold size={20} weight="regular" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Column 1: Logistics & Equipment */}
        <div className="space-y-8">
          <div className="relative pl-8 border-l-2 border-hairline py-2 space-y-10">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-canvas border-2 border-ink rounded-full" />
            <div className="absolute -left-[9px] bottom-0 w-4 h-4 bg-canvas border-2 border-primary/30 rounded-full" />
            
            <div>
              <div className="text-[18px] font-semibold text-ink leading-none">
                {load.origin.city}, {load.origin.state}
              </div>
              <div className="text-[14px] text-muted-foreground mt-1.5">
                Pickup: {new Date(load.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            
            <div>
              <div className="text-[18px] font-semibold text-ink leading-none">
                {load.destination.city}, {load.destination.state}
              </div>
              <div className="text-[14px] text-muted-foreground mt-1.5">
                Delivery: {load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-hairline">
            <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">EQUIPMENT SPECS</h4>
            <div className="grid grid-cols-2 gap-y-3 text-[15px]">
              <div className="text-muted-foreground">Truck Type</div>
              <div className="font-semibold text-ink">{load.equipment.truck}</div>
              <div className="text-muted-foreground">Load Size</div>
              <div className="font-semibold text-ink">{load.equipment.load}</div>
              <div className="text-muted-foreground">Weight</div>
              <div className="font-semibold text-ink">{load.equipment.weight}</div>
              <div className="text-muted-foreground">Commodity</div>
              <div className="font-semibold text-ink truncate">{load.equipment.commodity}</div>
            </div>
          </div>
        </div>

        {/* Column 2: Financials */}
        <div className="space-y-8 border-x border-hairline px-10">
          <div>
            <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">FINANCIALS</h4>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[48px] font-semibold text-ink tracking-tight">${load.rate.toLocaleString()}</span>
              <span className="text-[16px] text-muted-foreground">total rate</span>
            </div>
            <div className="flex items-center gap-4 text-[15px]">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[12px] uppercase font-bold tracking-wider">Per Mile</span>
                <span className="font-semibold text-ink">${load.trip > 0 ? (load.rate / load.trip).toFixed(2) : "—"}</span>
              </div>
              <div className="w-px h-8 bg-hairline" />
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[12px] uppercase font-bold tracking-wider">Distance</span>
                <span className="font-semibold text-ink">{load.trip} mi</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-hairline">
            <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">LOAD REFERENCE</h4>
            <div className="bg-surface-soft rounded-lg p-5 space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-muted-foreground font-medium">Reference ID</span>
                <span className="font-semibold text-ink font-mono">{load.equipment.refId}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-muted-foreground font-medium">Equipment</span>
                <span className="font-semibold text-ink">{load.equipment.truck}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-muted-foreground font-medium">Commodity</span>
                <span className="font-semibold text-ink">{load.equipment.commodity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Primary CTA */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">SHIPMENT SUMMARY</h4>
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origin</span>
                  <span className="font-semibold text-ink">{load.origin.city}, {load.origin.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-semibold text-ink">{load.destination.city}, {load.destination.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-semibold text-ink">{load.trip} miles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold text-success text-lg">${load.rate.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onBook}
              className="w-full h-12 bg-primary text-white font-semibold text-[14px] rounded-md shadow-md hover:bg-primary-active transition-all"
            >
              Send Booking Request
            </button>
            <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground font-medium pt-2">
              <Package size={14} />
              Ref: {load.equipment.refId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
