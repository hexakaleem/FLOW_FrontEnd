"use client";

import React, { useState } from "react";
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
  const [filters, setFilters] = useState({
    origin: "",
    dho: 150,
    destination: "",
    dhd: 150,
    equipmentType: "Vans (Standard)",
    loadType: "Full & Partial",
    dateRange: "6/11/2025 - 6/11/2025",
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleInputChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col bg-canvas border-b border-hairline shadow-sm">
      {/* Search Tabs / Breadcrumbs — Cal.com Nav Pill Group style */}
      <div className="flex items-center gap-1 px-4 py-2 bg-surface-soft border-b border-hairline overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-canvas border border-hairline rounded-pill shadow-sm">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[13px] font-medium text-ink whitespace-nowrap">
            {filters.origin || "Dallas, TX"} <span className="text-muted-foreground mx-1">→</span> {filters.destination || "Anywhere"}
          </span>
          <button className="text-muted-foreground hover:text-ink text-[10px] ml-1">✕</button>
        </div>
        <button className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white shadow-sm hover:bg-primary-active transition-colors ml-2 shrink-0">
          <Plus size={16} weight="bold" />
        </button>
      </div>

      {/* Main Filter Rows */}
      <div className="p-8 space-y-6">
        {/* Row 1: Origins & Destinations */}
        <div className="flex items-center gap-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">Origin</label>
              <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md focus-within:border-ink focus-within:ring-1 focus-within:ring-ink transition-all">
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.origin}
                  onChange={(e) => handleInputChange("origin", e.target.value)}
                  className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">DH-O</label>
              <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md focus-within:border-ink focus-within:ring-1 focus-within:ring-ink transition-all">
                <input
                  type="number"
                  value={filters.dho}
                  onChange={(e) => handleInputChange("dho", parseInt(e.target.value))}
                  className="w-full bg-transparent text-[16px] text-ink outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center pt-6">
            <div className="p-2 hover:bg-surface-soft rounded-full transition-colors cursor-pointer group" onClick={() => {
              const temp = filters.origin;
              handleInputChange("origin", filters.destination);
              handleInputChange("destination", temp);
            }}>
              <ArrowsLeftRight size={20} weight="regular" className="text-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">Destination</label>
              <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md focus-within:border-ink focus-within:ring-1 focus-within:ring-ink transition-all">
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.destination}
                  onChange={(e) => handleInputChange("destination", e.target.value)}
                  className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">DH-D</label>
              <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md focus-within:border-ink focus-within:ring-1 focus-within:ring-ink transition-all">
                <input
                  type="number"
                  value={filters.dhd}
                  onChange={(e) => handleInputChange("dhd", parseInt(e.target.value))}
                  className="w-full bg-transparent text-[16px] text-ink outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Equipment & Specs */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">Equipment</label>
            <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-all cursor-pointer">
              <span className="flex-1 text-[16px] text-ink">{filters.equipmentType}</span>
              <CaretDown size={14} weight="bold" className="text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">Load Type</label>
            <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-all cursor-pointer">
              <span className="flex-1 text-[16px] text-ink">{filters.loadType}</span>
              <CaretDown size={14} weight="bold" className="text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[13px] font-semibold text-muted-foreground mb-1.5 block">Date</label>
            <div className="flex items-center h-10 px-3.5 bg-canvas border border-hairline rounded-md hover:bg-surface-soft transition-all cursor-pointer group">
              <span className="flex-1 text-[16px] text-ink">{filters.dateRange}</span>
              <CalendarBlank size={18} weight="bold" className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>

          <button 
            disabled={isLoading}
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 h-10 px-8 bg-primary text-white rounded-md font-semibold text-[14px] shadow-sm hover:bg-primary-active transition-all self-end mb-0.5 disabled:opacity-50"
          >
            <MagnifyingGlass size={18} weight="bold" />
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Row 3: Secondary Filters — Nav Pill Group style */}
        <div className="flex items-center gap-8 pt-2">
          <div className="nav-pill-group flex items-center gap-4">
            <button className="text-[13px] font-medium text-muted hover:text-ink transition-colors flex items-center gap-1.5">
              Load Requirements <CaretDown size={12} weight="bold" />
            </button>
            <button className="text-[13px] font-medium text-muted hover:text-ink transition-colors flex items-center gap-1.5">
              Search Back - 24 hrs <CaretDown size={12} weight="bold" />
            </button>
            <button className="text-[13px] font-medium text-muted hover:text-ink transition-colors flex items-center gap-1.5">
              Company <CaretDown size={12} weight="bold" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="badge-pill bg-surface-card text-ink text-[13px] font-medium px-4 py-1.5 rounded-pill hover:bg-surface-strong transition-colors">
              Only Bookable
            </button>
            <button className="text-[13px] font-medium text-muted hover:text-ink transition-colors underline decoration-hairline underline-offset-4">
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
