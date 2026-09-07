"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  airportCodeLabel,
  airportFacilityType,
  airportInputValue,
  airportUseLabel,
  type AirportOption,
} from "@/lib/airports";

type AirportAutocompleteProps = {
  initialAirport?: AirportOption | null;
  inputId?: string;
  name: string;
  onSelectionChange?: (airport: AirportOption | null) => void;
  required?: boolean;
};

export function AirportAutocomplete({
  initialAirport = null,
  inputId,
  name,
  onSelectionChange,
  required = false,
}: AirportAutocompleteProps) {
  const generatedId = useId();
  const id = inputId ?? `airport-${generatedId}`;
  const listId = `${id}-results`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<AirportOption | null>(initialAirport);
  const [query, setQuery] = useState(initialAirport ? airportInputValue(initialAirport) : "");
  const [results, setResults] = useState<AirportOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!isOpen || !trimmedQuery || (selected && query === airportInputValue(selected))) {
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { results?: AirportOption[]; error?: string };
        if (!response.ok) throw new Error(payload.error);
        const airports = payload.results ?? [];
        setResults(airports);
        setActiveIndex(airports.length ? 0 : -1);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error && requestError.message
          ? requestError.message
          : "Airport search is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setHasSearched(true);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query, selected]);

  function chooseAirport(airport: AirportOption) {
    inputRef.current?.setCustomValidity("");
    setSelected(airport);
    setQuery(airportInputValue(airport));
    setResults([]);
    setActiveIndex(-1);
    setIsOpen(false);
    setHasSearched(false);
    setError(null);
    onSelectionChange?.(airport);
  }

  function clearAirport() {
    inputRef.current?.setCustomValidity("");
    setSelected(null);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setIsOpen(false);
    setHasSearched(false);
    setError(null);
    onSelectionChange?.(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      if (results.length) setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && isOpen && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      chooseAirport(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return <div className="airport-picker" ref={rootRef}>
    <input type="hidden" name={name} value={selected?.id ?? ""} />
    <div className="airport-search-input">
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-required={required}
        autoComplete="off"
        placeholder="Search identifier, airport, or city…"
        required={required}
        value={query}
        onChange={(event) => {
          if (selected) {
            setSelected(null);
            onSelectionChange?.(null);
          }
          const nextQuery = event.target.value;
          event.currentTarget.setCustomValidity(nextQuery.trim() ? "Choose an airport from the FAA results or clear the field." : "");
          setQuery(nextQuery);
          setResults([]);
          setActiveIndex(-1);
          setIsLoading(Boolean(nextQuery.trim()));
          setHasSearched(false);
          setError(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {query ? <button type="button" className="airport-clear" aria-label="Clear airport selection" onClick={clearAirport}>×</button> : null}
    </div>

    {selected ? <div className="airport-selection-meta">
      <span>{airportUseLabel(selected)}</span>
      <span>{airportFacilityType(selected)}</span>
      <span>{[selected.city, selected.state].filter(Boolean).join(", ")}</span>
    </div> : null}

    {isOpen && results.length ? <ul id={listId} className="airport-results" role="listbox">
      {results.map((airport, index) => <li
        id={`${id}-option-${index}`}
        key={airport.id}
        role="option"
        aria-selected={index === activeIndex}
        className={index === activeIndex ? "active" : undefined}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => chooseAirport(airport)}
      >
        <div><b>{airportCodeLabel(airport)}</b><span>{airportUseLabel(airport)}</span><span>{airportFacilityType(airport)}</span></div>
        <strong>{airport.name}</strong>
        <small>{[airport.city, airport.state].filter(Boolean).join(", ") || airport.country_code || "Location unavailable"}</small>
      </li>)}
    </ul> : null}

    <div className="airport-search-status" role="status" aria-live="polite">
      {isLoading ? "Searching FAA facilities…" : error ?? (isOpen && hasSearched && !results.length ? "No active FAA facilities found." : "")}
    </div>
  </div>;
}
