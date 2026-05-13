"use client";

import React from "react";
import {
  MapTrifold,
  Printer,
  Phone,
  CaretDown,
  Info,
  Package,
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
}

export function LoadExpandedDetails({ load }: LoadExpandedDetailsProps) {
  return (
    <div className="bg-white p-6 border-b border-hairline animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          {load.origin.city}, {load.origin.state}
          <div className="flex items-center text-dat-blue scale-x-125">↔</div>
          {load.destination.city}, {load.destination.state}
          <span className="text-slate-400 font-medium ml-2">{load.trip} mi</span>
        </h2>
        <button className="p-2 text-slate-400 hover:text-dat-blue hover:bg-slate-50 rounded-full transition-all">
          <Printer size={20} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Trip & Equipment */}
        <div className="space-y-6">
          <div className="relative pl-6 border-l-2 border-dashed border-slate-200 py-1">
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm" />
            <div className="absolute -left-[9px] bottom-0 w-4 h-4 bg-white border-2 border-dat-blue rounded-sm" />
            <div className="mb-8">
              <div className="text-sm font-bold text-slate-900">
                {load.origin.city}, {load.origin.state} ({load.origin.dh})
              </div>
              <div className="text-xs text-slate-400 font-medium">Jun 11 04:00PM - 04:00PM</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {load.destination.city}, {load.destination.state}
              </div>
              <div className="text-xs text-slate-400 font-medium">06/11 07:00PM - 07:00PM</div>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm hover:border-dat-blue hover:text-dat-blue transition-all">
            <MapTrifold size={16} weight="bold" />
            VIEW ROUTE
          </button>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Equipment</h4>
            <div className="grid grid-cols-2 gap-y-2 text-[13px]">
              <div className="text-slate-400">Load</div>
              <div className="font-medium text-slate-800">{load.equipment.load}</div>
              <div className="text-slate-400">Truck</div>
              <div className="font-medium text-slate-800">{load.equipment.truck}</div>
              <div className="text-slate-400">Length</div>
              <div className="font-medium text-slate-800">{load.equipment.length}</div>
              <div className="text-slate-400">Weight</div>
              <div className="font-medium text-slate-800">{load.equipment.weight}</div>
              <div className="text-slate-400">Commodity</div>
              <div className="font-medium text-slate-800 truncate">{load.equipment.commodity}</div>
              <div className="text-slate-400">Reference ID</div>
              <div className="font-medium text-slate-800">{load.equipment.refId}</div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">CONTACT INFORMATION</h4>
            <button className="text-dat-blue font-bold hover:underline">{load.broker.phone}</button>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">COMMENTS</h4>
            <div className="text-xs text-slate-500 italic">No comments provided.</div>
          </div>
        </div>

        {/* Column 2: Rates & Market Data */}
        <div className="space-y-8 border-x border-slate-100 px-8">
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rate</h4>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-slate-500 font-medium">Total</div>
              <div className="font-bold text-slate-900">${load.rate}</div>
              <div className="text-slate-500 font-medium">Trip</div>
              <div className="font-bold text-slate-900">{load.trip} mi</div>
              <div className="text-slate-500 font-medium">Rate / mile</div>
              <div className="font-bold text-slate-900">
                ${(load.rate / load.trip).toFixed(2)} <Info size={14} className="inline ml-1 text-slate-300" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                MARKET RATES <span className="text-slate-300 font-normal">Powered by</span> <span className="text-dat-blue">DAT iQ</span>
              </h4>
              <button className="text-[10px] font-bold text-dat-blue hover:underline">RATEVIEW</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">SPOT RATE</span>
                  <span className="text-[10px] font-medium text-slate-400">Dallas Mkt - Ft Worth Mkt</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-black text-slate-900">${Math.round(load.rate * 1.2)}</span>
                  <div className="pb-1 text-slate-300 flex-1">
                    <div className="h-1 bg-slate-100 rounded-full relative">
                      <div className="absolute left-1/4 right-1/4 top-0 h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-2 border-white rounded-full shadow-md" />
                    </div>
                  </div>
                  <Info size={16} className="text-slate-300 mb-1" />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>Range:</span>
                    <span className="text-slate-900">${Math.round(load.rate * 1.1)} - ${Math.round(load.rate * 1.3)}</span>
                  </div>
                  <span className="text-slate-400">{load.trip} mi | 15d average</span>
                </div>
              </div>

              <div className="pt-4 opacity-50">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">CONTRACT RATE</h4>
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <Package size={32} weight="duotone" className="text-slate-200 mb-2" />
                  <p className="text-[11px] text-slate-400 font-medium">Contract Rates are not available for this subscription</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Company & Actions */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company</h4>
              <div className="text-lg font-bold text-slate-900">{load.broker.name}</div>
            </div>
            <button className="text-[10px] font-bold text-dat-blue hover:underline">VIEW IN DIRECTORY</button>
          </div>

          <div className="flex items-center justify-between text-dat-blue">
            <button className="flex items-center gap-2 font-bold text-sm">
              <Phone size={18} weight="fill" />
              {load.broker.phone}
            </button>
            <button className="p-1 hover:bg-slate-50 rounded transition-colors">
              <CaretDown size={16} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-4 pt-2">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">MC#</div>
              <div className="text-sm font-medium text-slate-800">{load.broker.mc}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-right">Credit Score</div>
              <div className="text-sm font-bold text-slate-800 text-right">{load.broker.creditScore}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</div>
              <div className="text-sm font-medium text-slate-800">{load.broker.location}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-right">Days to Pay</div>
              <div className="text-sm font-bold text-slate-800 text-right">{load.broker.daysToPay}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                weight="fill"
                className={i < Math.floor(load.broker.rating) ? "text-amber-400" : "text-slate-200"}
              />
            ))}
            <span className="text-[11px] font-bold text-slate-400 ml-2">({Math.floor(Math.random() * 200)})</span>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">LOAD ACTIVITY</h4>
            <div className="text-sm font-bold text-slate-900">No activity yet!</div>
            <p className="text-[11px] text-slate-400">Be the first to make an offer.</p>
          </div>

          <div className="pt-4 space-y-3">
            <button className="w-full h-12 bg-dat-blue text-white font-black text-xs uppercase tracking-[0.2em] rounded shadow-lg hover:bg-dat-blue-hover transition-all">
              BOOK
            </button>
            <button className="w-full h-10 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded flex items-center justify-between px-4 hover:border-slate-300 transition-all">
              MARK AS...
              <CaretDown size={14} weight="bold" />
            </button>
          </div>

          <div className="pt-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">LOAD RESOURCES</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Factor with</span>
                <span className="text-[11px] font-bold text-slate-900">$ FREIGHT FACTORING</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Insurance</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border-2 border-emerald-500" />
                    DAT ASSURANCE
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border-2 border-slate-900" />
                    PER LOAD INSURANCE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
