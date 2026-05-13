"use client";

import React, { useState } from "react";
import {
  MagnifyingGlass,
  ArrowsLeftRight,
  ArrowClockwise,
  MapPin,
  Compass,
  FlagCheckered,
} from "@phosphor-icons/react";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";

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

const RADIUS_OPTIONS = [
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 100, label: "100 mi" },
  { value: 250, label: "250 mi" },
  { value: 500, label: "500 mi" },
  { value: 0, label: "Exact City" },
];

export function MarketplaceFilters({ onSearch, isLoading }: MarketplaceFiltersProps) {
  const [filters, setFilters] = useState({
    origin: "",
    originLat: null as number | null,
    originLng: null as number | null,
    originRadius: 100,
    destination: "",
    destLat: null as number | null,
    destLng: null as number | null,
    destRadius: 100,
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

  const handleInputChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleOriginSelect = (place: any) => {
    setFilters(prev => ({
      ...prev,
      origin: place.display_name,
      originLat: parseFloat(place.lat),
      originLng: parseFloat(place.lon)
    }));
  };

  const handleDestSelect = (place: any) => {
    setFilters(prev => ({
      ...prev,
      destination: place.display_name,
      destLat: parseFloat(place.lat),
      destLng: parseFloat(place.lon)
    }));
  };

  const handleClear = () => {
    const cleared = {
      origin: "",
      originLat: null,
      originLng: null,
      originRadius: 100,
      destination: "",
      destLat: null,
      destLng: null,
      destRadius: 100,
      equipmentType: "",
      minRate: "",
      maxRate: "",
    };
    setFilters(cleared);
    onSearch(cleared);
  };

  const handleSwap = () => {
    setFilters((prev) => ({
      ...prev,
      origin: prev.destination,
      originLat: prev.destLat,
      originLng: prev.destLng,
      destination: prev.origin,
      destLat: prev.originLat,
      destLng: prev.originLng
    }));
  };

  return (
    <div className="flex flex-col bg-canvas border-b border-hairline shadow-sm">
      <div className="p-6 pb-5 space-y-5">
        {/* Row 1: Origin & Destination with Radius */}
        <div className="flex items-end gap-3">
          <div className="flex-[2] space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <MapPin size={12} weight="bold" className="text-primary" />
              Origin
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <LocationAutocomplete
                  value={filters.origin}
                  onChange={(val) => {
                    handleInputChange("origin", val);
                    if (!val) {
                      handleInputChange("originLat", null);
                      handleInputChange("originLng", null);
                    }
                  }}
                  onPlaceSelect={handleOriginSelect}
                  placeholder="Search pickup city..."
                  className="w-full"
                />
              </div>
              <div className="w-28">
                <select
                  value={filters.originRadius}
                  onChange={(e) => handleInputChange("originRadius", Number(e.target.value))}
                  className="w-full h-11 px-3 bg-surface-soft border border-hairline rounded-lg text-sm font-medium outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {RADIUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSwap}
            className="flex items-center justify-center h-11 w-11 rounded-lg border border-hairline bg-canvas text-primary hover:bg-surface-soft transition-colors shrink-0 mb-0.5"
            title="Swap origin and destination"
          >
            <ArrowsLeftRight size={20} weight="bold" />
          </button>

          <div className="flex-[2] space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <FlagCheckered size={12} weight="bold" className="text-ink" />
              Destination
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <LocationAutocomplete
                  value={filters.destination}
                  onChange={(val) => {
                    handleInputChange("destination", val);
                    if (!val) {
                      handleInputChange("destLat", null);
                      handleInputChange("destLng", null);
                    }
                  }}
                  onPlaceSelect={handleDestSelect}
                  placeholder="Search delivery city..."
                  className="w-full"
                />
              </div>
              <div className="w-28">
                <select
                  value={filters.destRadius}
                  onChange={(e) => handleInputChange("destRadius", Number(e.target.value))}
                  className="w-full h-11 px-3 bg-surface-soft border border-hairline rounded-lg text-sm font-medium outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {RADIUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Equipment, Rate Range, Actions */}
        <div className="flex items-end gap-4">
          <div className="w-48 space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
              Equipment
            </label>
            <select
              value={filters.equipmentType}
              onChange={(e) => handleInputChange("equipmentType", e.target.value)}
              className="w-full h-11 px-4 bg-canvas border border-hairline rounded-lg text-sm font-semibold text-ink outline-none appearance-none cursor-pointer hover:border-muted focus:border-primary transition-all"
            >
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32 space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
              Min Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">$</span>
              <input
                type="number"
                placeholder="0"
                value={filters.minRate}
                onChange={(e) => handleInputChange("minRate", e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 pl-7 pr-3 bg-canvas border border-hairline rounded-lg text-sm font-bold text-ink outline-none placeholder:text-muted/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="w-32 space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
              Max Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">$</span>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxRate}
                onChange={(e) => handleInputChange("maxRate", e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 pl-7 pr-3 bg-canvas border border-hairline rounded-lg text-sm font-bold text-ink outline-none placeholder:text-muted/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleClear}
              className="h-11 px-5 text-xs font-bold text-muted hover:text-ink transition-all"
            >
              Clear
            </button>
            <button
              disabled={isLoading}
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 h-11 px-10 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <ArrowClockwise size={20} weight="bold" className="animate-spin" />
              ) : (
                <MagnifyingGlass size={20} weight="bold" />
              )}
              {isLoading ? "Searching..." : "Search Loads"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
