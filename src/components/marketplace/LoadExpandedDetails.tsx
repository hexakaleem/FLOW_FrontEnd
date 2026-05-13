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
    <div className="bg-canvas p-6 border-b border-hairline animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-ink flex items-center gap-3">
          {load.origin.city}, {load.origin.state}
          <div className="flex items-center text-dat-blue scale-x-125">↔</div>
          {load.destination.city}, {load.destination.state}
          <span className="text-muted-foreground font-medium ml-2">{load.trip} mi</span>
        </h2>
        <button className="p-2 text-muted-foreground hover:text-dat-blue hover:bg-surface-soft rounded-full transition-all">
          <Printer size={20} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Trip & Equipment */}
        <div className="space-y-6">
          <div className="relative pl-6 border-l-2 border-dashed border-hairline py-1">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-canvas border-2 border-ink rounded-sm" />
            <div className="absolute -left-[9px] bottom-0 w-4 h-4 bg-canvas border-2 border-dat-blue rounded-sm" />
            <div className="mb-8">
              <div className="text-sm font-bold text-ink">
                {load.origin.city}, {load.origin.state} ({load.origin.dh})
              </div>
              <div className="text-xs text-muted-foreground font-medium">Scheduled Pickup</div>
            </div>
            <div>
              <div className="text-sm font-bold text-ink">
                {load.destination.city}, {load.destination.state}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Scheduled Delivery</div>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-canvas border border-hairline rounded-full text-xs font-bold text-ink shadow-sm hover:border-dat-blue hover:text-dat-blue transition-all">
            <MapTrifold size={16} weight="bold" />
            VIEW ROUTE
          </button>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Equipment Details</h4>
            <div className="grid grid-cols-2 gap-y-2 text-[13px]">
              <div className="text-muted-foreground">Load Type</div>
              <div className="font-medium text-ink">{load.equipment.load}</div>
              <div className="text-muted-foreground">Truck Type</div>
              <div className="font-medium text-ink">{load.equipment.truck}</div>
              <div className="text-muted-foreground">Length</div>
              <div className="font-medium text-ink">{load.equipment.length}</div>
              <div className="text-muted-foreground">Weight</div>
              <div className="font-medium text-ink">{load.equipment.weight}</div>
              <div className="text-muted-foreground">Commodity</div>
              <div className="font-medium text-ink truncate">{load.equipment.commodity}</div>
              <div className="text-muted-foreground">Reference ID</div>
              <div className="font-medium text-ink">{load.equipment.refId}</div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">CONTACT</h4>
            <button className="text-dat-blue font-bold hover:underline">{load.broker.phone}</button>
          </div>
        </div>

        {/* Column 2: Rates & Market Data */}
        <div className="space-y-8 border-x border-hairline px-8">
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Pricing</h4>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-body-text font-medium">Linehaul Total</div>
              <div className="font-bold text-ink">${load.rate}</div>
              <div className="text-body-text font-medium">Distance</div>
              <div className="font-bold text-ink">{load.trip} mi</div>
              <div className="text-body-text font-medium">Rate / mile</div>
              <div className="font-bold text-ink">
                ${(load.rate / load.trip).toFixed(2)} <Info size={14} className="inline ml-1 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-hairline">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                MARKET RATES <span className="text-muted-foreground/50 font-normal">via</span> <span className="text-dat-blue">DAT iQ</span>
              </h4>
              <button className="text-[10px] font-bold text-dat-blue hover:underline">ANALYTICS</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-ink uppercase tracking-widest">SPOT RATE</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Market Average</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-black text-ink">${Math.round(load.rate * 1.2)}</span>
                  <div className="pb-1 text-muted-foreground/30 flex-1">
                    <div className="h-1 bg-surface-soft rounded-full relative">
                      <div className="absolute left-1/4 right-1/4 top-0 h-full bg-success rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-ink border-2 border-canvas rounded-full shadow-md" />
                    </div>
                  </div>
                  <Info size={16} className="text-muted-foreground/30 mb-1" />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Market Range:</span>
                    <span className="text-ink">${Math.round(load.rate * 1.1)} - ${Math.round(load.rate * 1.3)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 opacity-60">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">CONTRACT RATE</h4>
                <div className="bg-surface-soft border border-dashed border-hairline rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <Package size={32} weight="duotone" className="text-muted-foreground/20 mb-2" />
                  <p className="text-[11px] text-muted-foreground font-medium">Contract rate data restricted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Company & Actions */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Broker</h4>
              <div className="text-lg font-bold text-ink">{load.broker.name}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-dat-blue">
            <button className="flex items-center gap-2 font-bold text-sm">
              <Phone size={18} weight="fill" />
              {load.broker.phone}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-4 pt-2">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">MC#</div>
              <div className="text-sm font-medium text-ink">{load.broker.mc}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-right">Credit</div>
              <div className="text-sm font-bold text-ink text-right">{load.broker.creditScore}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Location</div>
              <div className="text-sm font-medium text-ink">{load.broker.location}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-right">Pay Days</div>
              <div className="text-sm font-bold text-ink text-right">{load.broker.daysToPay}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                weight="fill"
                className={i < Math.floor(load.broker.rating) ? "text-warning" : "text-surface-strong"}
              />
            ))}
            <span className="text-[11px] font-bold text-muted-foreground ml-2">({Math.floor(Math.random() * 200)})</span>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              onClick={onBook}
              className="w-full h-12 bg-dat-blue text-white font-black text-xs uppercase tracking-[0.2em] rounded shadow-lg hover:bg-dat-blue-hover transition-all"
            >
              BOOK LOAD
            </button>
            <button className="w-full h-10 bg-canvas border border-hairline text-ink font-bold text-xs uppercase tracking-widest rounded flex items-center justify-between px-4 hover:bg-surface-soft transition-all">
              SAVE FOR LATER
              <CaretDown size={14} weight="bold" />
            </button>
          </div>

          <div className="pt-4 border-t border-hairline">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">RESOURCES</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Factoring</span>
                <span className="text-[11px] font-bold text-ink">FREIGHT FACTORING</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Assurance</span>
                <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  DAT GUARANTEED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
