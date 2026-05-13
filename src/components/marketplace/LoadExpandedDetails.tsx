"use client";

import React from "react";
import {
  MapTrifold,
  Printer,
  Phone,
  CaretDown,
  Info,
  Package,
  Star,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Load {
  _id: string;
  origin: { city: string; state: string; dh?: number; zip?: string };
  destination: { city: string; state: string; dh?: number; zip?: string };
  trip: number;
  rate: number;
  equipment: {
    load: string;
    truck: string;
    length: string;
    weight: string;
    commodity: string;
    refId: string;
  };
  broker: {
    name: string;
    phone: string;
    mc: string;
    creditScore: number;
    daysToPay: number;
    rating: number;
    location: string;
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
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center h-10 w-10 rounded-full border border-hairline text-ink hover:bg-surface-soft transition-all">
            <Printer size={20} weight="regular" />
          </button>
          <button className="flex items-center justify-center h-10 w-10 rounded-full border border-hairline text-ink hover:bg-surface-soft transition-all">
            <MapTrifold size={20} weight="regular" />
          </button>
        </div>
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
              <div className="text-[14px] text-muted-foreground mt-1.5">Scheduled for Jun 11 • 14:00</div>
            </div>
            
            <div>
              <div className="text-[18px] font-semibold text-ink leading-none">
                {load.destination.city}, {load.destination.state}
              </div>
              <div className="text-[14px] text-muted-foreground mt-1.5">Delivery estimated Jun 13</div>
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

        {/* Column 2: Financials & Market Intelligence */}
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
                <span className="font-semibold text-ink">${(load.rate / load.trip).toFixed(2)}</span>
              </div>
              <div className="w-px h-8 bg-hairline" />
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[12px] uppercase font-bold tracking-wider">Distance</span>
                <span className="font-semibold text-ink">{load.trip} mi</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-hairline">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                MARKET INTELLIGENCE <Info size={14} className="text-muted-foreground/40" />
              </h4>
              <span className="text-[10px] font-medium px-2 py-0.5 bg-surface-soft border border-hairline rounded-pill">DAT iQ POWERED</span>
            </div>

            <div className="bg-surface-soft rounded-lg p-6 space-y-6">
              <div>
                <div className="flex justify-between text-[13px] font-semibold text-ink mb-2">
                  <span>Current Spot Avg</span>
                  <span>${Math.round(load.rate * 1.15).toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-hairline rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[75%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-2 font-medium">
                  <span>Low: ${Math.round(load.rate * 1.05)}</span>
                  <span>High: ${Math.round(load.rate * 1.25)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-canvas border border-hairline border-dashed rounded-md">
                <Package size={20} className="text-primary/20" />
                <span className="text-[12px] font-medium text-muted-foreground">Contract rates restricted for your account.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Partner Info & Primary CTA */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">BROKER PARTNER</h4>
              <div className="text-[22px] font-semibold text-ink leading-tight">{load.broker.name}</div>
              <div className="text-[14px] text-muted-foreground mt-1 flex items-center gap-2">
                {load.broker.location} • MC#{load.broker.mc}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-hairline">
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Credit Score</span>
                <span className="text-[18px] font-semibold text-ink">{load.broker.creditScore}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Days to Pay</span>
                <span className="text-[18px] font-semibold text-ink">{load.broker.daysToPay}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  weight="fill"
                  className={i < Math.floor(load.broker.rating) ? "text-warning" : "text-hairline"}
                />
              ))}
              <span className="text-[13px] font-semibold text-ink ml-2">{load.broker.rating}</span>
              <span className="text-[13px] text-muted-foreground ml-1">({Math.floor(Math.random() * 500)} reviews)</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onBook}
              className="w-full h-12 bg-primary text-white font-semibold text-[14px] rounded-md shadow-md hover:bg-primary-active transition-all"
            >
              Confirm Booking Request
            </button>
            <button className="w-full h-12 bg-canvas border border-hairline text-ink font-semibold text-[14px] rounded-md hover:bg-surface-soft transition-all">
              Save for Review
            </button>
            <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground font-medium pt-2">
              <Phone size={14} />
              Contact Partner: {load.broker.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
