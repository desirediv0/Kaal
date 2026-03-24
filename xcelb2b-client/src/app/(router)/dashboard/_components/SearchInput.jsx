"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { debounce } from "lodash";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEBOUNCE_DELAY = 450;

export function SearchComponent({ apiEndpoint, renderCard, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { checkAuth } = useAuth();
  const router = useRouter();
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const searchItems = useCallback(
    async (searchQuery) => {
      if (searchQuery.trim() === "") {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const currentRequestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const isAuth = await checkAuth();
        if (!isAuth) {
          router.push("/");
          return;
        }
        const response = await axios.get(
          `${apiEndpoint}?q=${encodeURIComponent(searchQuery)}`,
          { signal: abortControllerRef.current.signal }
        );
        if (currentRequestId === requestIdRef.current) {
          setResults(response.data.data);
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        if (currentRequestId === requestIdRef.current) {
          setError("An error occurred while searching. Please try again.");
          setResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [apiEndpoint, checkAuth, router]
  );

  const searchItemsRef = useRef(searchItems);
  searchItemsRef.current = searchItems;

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => searchItemsRef.current(q), DEBOUNCE_DELAY, {
        leading: false,
        trailing: true,
      }),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  return (
    <div className="w-full max-w-2xl  space-y-4 relative">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="w-full pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {results.length > 0 ? (
        <div className="absolute left-0 right-0 z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-2">
          <ScrollArea className="flex flex-col gap-3 max-h-72 overflow-y-auto p-4">
            {results.map((item) => (
              <Card key={item.id} className="my-2">
                <CardContent className="p-4">{renderCard(item)}</CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>
      ) : (
        query &&
        !isLoading && (
          <p className="text-center text-muted-foreground">No results found.</p>
        )
      )}
    </div>
  );
}
