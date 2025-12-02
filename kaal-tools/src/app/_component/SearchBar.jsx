"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";
import { useCustomDebounce } from "@/hook/useCustomDebounce";

export default function SearchBar({ onSearch, isSearching, onClearSearch }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useCustomDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery?.trim()) {
      onClearSearch?.();
      return;
    }
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch, onClearSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onClearSearch?.();
  }, [onClearSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      handleClear();
      return;
    }
    onSearch(query);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      onClearSearch?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search products..."
        className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="p-2 text-gray-500 hover:text-orange-500 disabled:opacity-50 transition-colors"
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
}