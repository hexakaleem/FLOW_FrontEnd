"use client";

import React, { useState } from "react";
import {
  MagnifyingGlass,
  ArrowsLeftRight,
  ArrowClockwise,
} from "@phosphor-icons/react";

interface MarketplaceFiltersProps {
  onSearch: (filters: any) => void;
  isLoading?: boolean;
}

const EQUIPMENT_OPTIONS = [
  { value: "", label: "All Equipment" },
  { value: "Dry Van", label: "Dry Van" },
  { value: "Flatbed", label: "Flatbed" },
  { value: "Reefer", label: "Reefer" },
  { value: "Step Deck", label: "Step Deck" },
  { value: "Lowboy", label: "Lowboy" },
  { value: "Tanker", label: "Tanker" },
];

export function MarketplaceFilters({ onSearch, isLoading }: MarketplaceFiltersProps) {
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    equipmentType: "",
    minRate: "",
    maxRate: "",
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleInputChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    const cleared = { origin: "", destination: "", equipmentType: "", minRate: "", maxRate: "" };
    setFilters(cleared);
    onSearch(cleared);
  };

  const handleSwap = () => {
    setFilters((prev) => ({ ...prev, origin: prev.destination, destination: prev.origin }));
  };

  return (
    <div className="flex flex-col bg-canvas border-b border-hairline shadow-sm">
      <div className="p-6 pb-5 space-y-5">
        {/* Row 1: Origin & Destination */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              Origin
            </label>
            <input
              type="text"
              placeholder="City or State"
              value={filters.origin}
              onChange={(e) => handleInputChange("origin", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-[15px] text-ink outline-none placeholder:text-muted/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            onClick={handleSwap}
            className="flex items-center justify-center h-11 w-11 rounded-lg border border-hairline bg-canvas text-primary hover:bg-surface-soft transition-colors shrink-0"
            title="Swap origin and destination"
          >
            <ArrowsLeftRight size={20} weight="bold" />
          </button>

          <div className="flex-1">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              Destination
            </label>
            <input
              type="text"
              placeholder="City or State"
              value={filters.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-[15px] text-ink outline-none placeholder:text-muted/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Row 2: Equipment, Rate Range, Actions */}
        <div className="flex items-end gap-4">
          <div className="w-48">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              Equipment
            </label>
            <select
              value={filters.equipmentType}
              onChange={(e) => handleInputChange("equipmentType", e.target.value)}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-[15px] text-ink outline-none appearance-none cursor-pointer hover:border-muted focus:border-primary transition-all"
            >
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              Min Rate ($)
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minRate}
              onChange={(e) => handleInputChange("minRate", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-[15px] text-ink outline-none placeholder:text-muted/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="w-36">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              Max Rate ($)
            </label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maxRate}
              onChange={(e) => handleInputChange("maxRate", e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-[15px] text-ink outline-none placeholder:text-muted/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleClear}
              className="h-11 px-5 border border-hairline rounded-lg text-[13px] font-semibold text-muted hover:text-ink hover:border-muted transition-all"
            >
              Clear
            </button>
            <button
              disabled={isLoading}
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 h-11 px-8 bg-primary text-white rounded-lg font-semibold text-[14px] shadow-sm hover:bg-primary-active transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <ArrowClockwise size={18} weight="bold" className="animate-spin" />
              ) : (
                <MagnifyingGlass size={18} weight="bold" />
              )}
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
