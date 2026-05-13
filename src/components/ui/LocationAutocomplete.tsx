"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlass, MapPin, Spinner } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, place?: PlaceSuggestion) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: PlaceSuggestion) => void;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  className,
  onPlaceSelect,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: "json",
        limit: "6",
        addressdetails: "1",
        countrycodes: "us",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch suggestions");

      const data: PlaceSuggestion[] = await res.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place: PlaceSuggestion) => {
    setQuery(place.display_name);
    onChange(place.display_name, place);
    onPlaceSelect?.(place);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getCity = (place: PlaceSuggestion) =>
    place.address?.city || place.address?.town || place.address?.village || "";
  const getState = (place: PlaceSuggestion) => place.address?.state || "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MagnifyingGlass
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-11 pl-11 pr-10 rounded-lg border border-hairline bg-canvas text-sm text-ink outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium placeholder:text-muted/50"
        />
        {isLoading && (
          <Spinner
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted animate-spin"
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-canvas border border-hairline rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((place, index) => (
            <button
              key={`${place.lat}-${place.lon}`}
              type="button"
              onClick={() => handleSelect(place)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-soft transition-colors border-b border-hairline last:border-b-0",
                index === highlightedIndex && "bg-surface-soft"
              )}
            >
              <MapPin
                size={18}
                className="text-primary shrink-0 mt-0.5"
                weight="fill"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink font-medium truncate">
                  {place.display_name.split(",").slice(0, 2).join(",")}
                </p>
                <p className="text-xs text-muted truncate">
                  {[getCity(place), getState(place)].filter(Boolean).join(", ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
