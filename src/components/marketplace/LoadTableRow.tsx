"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "@phosphor-icons/react";

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
  contact?: string;
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
        isExpanded ? "bg-surface-soft ring-1 ring-inset ring-primary/10" : "bg-canvas hover:bg-surface-soft/50"
      )}
    >
      <div className="flex items-center h-14 px-6 text-[14px] text-body-text font-medium">
        <div className="w-8 flex justify-center mr-3">
          <input 
            type="checkbox" 
            className="rounded-sm border-hairline accent-primary" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
        
        <div className="w-14 text-muted-foreground font-normal">{load.age}</div>
        
        <div className="w-24 font-semibold text-ink text-[15px]">
          ${load.rate.toLocaleString()}
        </div>
        
        <div className="w-16 text-primary font-bold">{load.trip}</div>
        
        <div className="w-44 truncate font-semibold text-ink">
          {load.origin.city}, {load.origin.state}
          <span className="ml-1 text-muted-foreground font-normal text-[12px]">({load.origin.dh})</span>
        </div>
        
        <div className="w-10 flex justify-center">
          <ArrowRight size={14} weight="bold" className="text-primary/40" />
        </div>
        
        <div className="w-44 truncate font-semibold text-ink">
          {load.destination.city}, {load.destination.state}
          <span className="ml-1 text-muted-foreground font-normal text-[12px]">({load.destination.dh})</span>
        </div>
        
        <div className="w-24 font-medium">{load.pickup}</div>
        
        <div className="flex-1 min-w-[160px] truncate text-muted-foreground">
          {load.equipment} • {load.weight}
        </div>
        
        <div className="w-48 text-ink font-semibold truncate hover:underline underline-offset-4 decoration-hairline">
          {load.company}
        </div>
        
        <div className="w-28 text-right font-semibold text-ink tabular-nums">
          {load.creditScore} <span className="text-[10px] text-muted-foreground uppercase ml-0.5">CS</span>
          <span className="mx-2 text-hairline">|</span>
          {load.daysToPay} <span className="text-[10px] text-muted-foreground uppercase ml-0.5">DTP</span>
        </div>
        
        <div className="w-24 flex justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); onBook(); }}
            className="h-8 px-4 bg-primary text-white text-[13px] font-semibold rounded-md shadow-sm hover:bg-primary-active transition-all"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
