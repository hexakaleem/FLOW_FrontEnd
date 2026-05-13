"use client";

import React from "react";
import {
  MagnifyingGlass,
  Plus,
  ArrowsLeftRight,
  CalendarBlank,
  CaretDown,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MarketplaceFiltersProps {
  onSearch: (filters: any) => void;
  isLoading?: boolean;
}

export function MarketplaceFilters({ onSearch, isLoading }: MarketplaceFiltersProps) {
  return (
    <div className="flex flex-col bg-white border-b border-hairline shadow-sm">
      {/* Search Tabs / Breadcrumbs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-hairline overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-hairline rounded-sm shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
            Dallas, TX <span className="text-slate-400 mx-1">→</span> Anywhere
          </span>
          <button className="text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
        </div>
        <button className="flex items-center justify-center h-7 w-7 rounded bg-dat-blue text-white shadow-sm hover:bg-dat-blue-hover transition-colors ml-2 shrink-0">
          <Plus size={16} weight="bold" />
        </button>
      </div>

      {/* Main Filter Rows */}
      <div className="p-4 space-y-3">
        {/* Row 1: Origins & Destinations */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Origin</label>
              <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue focus-within:ring-1 focus-within:ring-dat-blue transition-all">
                <input
                  type="text"
                  placeholder="City, State"
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
            <div className="w-20">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">DH-O</label>
              <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue focus-within:ring-1 focus-within:ring-dat-blue transition-all">
                <input
                  type="number"
                  defaultValue={150}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center pt-5">
            <ArrowsLeftRight size={18} weight="regular" className="text-dat-blue cursor-pointer hover:scale-110 transition-transform" />
          </div>

          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Destination</label>
              <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue focus-within:ring-1 focus-within:ring-dat-blue transition-all">
                <input
                  type="text"
                  placeholder="City, State"
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
            <div className="w-20">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">DH-D</label>
              <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue focus-within:ring-1 focus-within:ring-dat-blue transition-all">
                <input
                  type="number"
                  defaultValue={150}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Equipment & Specs */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Equipment Type</label>
            <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue transition-all cursor-pointer">
              <span className="flex-1 text-sm font-medium text-slate-700">Vans (Standard)</span>
              <CaretDown size={14} weight="bold" className="text-slate-400" />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Load Type</label>
            <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue transition-all cursor-pointer">
              <span className="flex-1 text-sm font-medium text-slate-700">Full & Partial</span>
              <CaretDown size={14} weight="bold" className="text-slate-400" />
            </div>
          </div>

          <div className="w-32">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Length ft</label>
            <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue transition-all">
              <input
                type="number"
                placeholder="Length"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Weight lbs</label>
            <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue transition-all">
              <input
                type="number"
                placeholder="Weight"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date Range</label>
            <div className="flex items-center h-10 px-3 bg-white border border-slate-300 rounded focus-within:border-dat-blue transition-all cursor-pointer group">
              <span className="flex-1 text-sm font-medium text-slate-700">6/11/2025 - 6/11/2025</span>
              <CalendarBlank size={16} weight="bold" className="text-slate-400 group-hover:text-dat-blue transition-colors" />
            </div>
          </div>

          <button className="flex items-center justify-center gap-2 h-10 px-6 bg-dat-blue text-white rounded font-bold text-xs uppercase tracking-widest shadow-md hover:bg-dat-blue-hover transition-all self-end mb-0.5">
            <MagnifyingGlass size={18} weight="bold" />
            Search
          </button>
        </div>

        {/* Row 3: Secondary Filters */}
        <div className="flex items-center gap-6 pt-1">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dat-blue transition-colors group">
              Load Requirements <CaretDown size={12} weight="bold" className="text-slate-300 group-hover:text-dat-blue" />
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dat-blue transition-colors group">
              Search Back - 24 hrs <CaretDown size={12} weight="bold" className="text-slate-300 group-hover:text-dat-blue" />
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dat-blue transition-colors group">
              Company <CaretDown size={12} weight="bold" className="text-slate-300 group-hover:text-dat-blue" />
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-dat-blue transition-colors group">
              Private Loads <CaretDown size={12} weight="bold" className="text-slate-300 group-hover:text-dat-blue" />
            </button>
          </div>

          <button className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-colors">
            Only Bookable
          </button>
        </div>
      </div>
    </div>
  );
}
