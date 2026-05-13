"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Star } from "@phosphor-icons/react";

interface Load {
  _id: string;
  age: string;
  rate: number;
  trip: number;
  origin: { city: string; state: string; dh?: number };
  destination: { city: string; state: string; dh?: number };
  pickup: string;
  equipment: string;
  weight: string;
  length: string;
  company: string;
  contact: string;
  creditScore: number;
  daysToPay: number;
}

interface LoadTableRowProps {
  load: Load;
  isExpanded: boolean;
  onToggle: () => void;
  onBook: () => void;
}

export function LoadTableRow({ load, isExpanded, onToggle, onBook }: LoadTableRowProps) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex flex-col border-b border-hairline transition-all cursor-pointer",
        isExpanded ? "bg-slate-50 ring-1 ring-inset ring-dat-blue" : "bg-white hover:bg-slate-50/50"
      )}
    >
      <div className="flex items-center h-12 px-4 text-[13px] text-slate-600 font-medium">
        <div className="w-8 flex justify-center mr-2">
          <input type="checkbox" className="rounded-sm border-slate-300" onClick={(e) => e.stopPropagation()} />
        </div>
        <div className="w-12 text-slate-400">{load.age}</div>
        <div className="w-20 font-bold text-slate-900">${load.rate.toLocaleString()} $</div>
        <div className="w-16 text-dat-blue font-bold">{load.trip}</div>
        <div className="w-40 truncate">{load.origin.city}, {load.origin.state}</div>
        <div className="w-12 text-slate-400">({load.origin.dh})</div>
        <div className="w-8 flex justify-center">
          <ArrowRight size={14} weight="bold" className="text-dat-blue" />
        </div>
        <div className="w-40 truncate">{load.destination.city}, {load.destination.state}</div>
        <div className="w-12 text-slate-400">({load.destination.dh})</div>
        <div className="w-20">{load.pickup}</div>
        <div className="flex-1 min-w-[150px] truncate">
          {load.equipment} • {load.weight} • {load.length}
        </div>
        <div className="w-40 text-dat-blue hover:underline truncate">{load.company}</div>
        <div className="w-40 text-slate-400 truncate">{load.contact}</div>
        <div className="w-24 text-right">
          <span className="font-bold text-slate-900">{load.creditScore}</span> CS
          <span className="mx-1 text-slate-300">|</span>
          <span className="font-bold text-slate-900">{load.daysToPay}</span> DTP
        </div>
        <div className="w-20 flex justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); onBook(); }}
            className="px-3 py-1 bg-white border border-dat-blue text-dat-blue text-[11px] font-bold rounded hover:bg-dat-blue hover:text-white transition-all uppercase tracking-wider"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
