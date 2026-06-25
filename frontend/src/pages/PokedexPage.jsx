import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import apiBaseUrl from "../api";
import { FilterPanel } from "../components/ui/FilterPanel";
import { PageHeader } from "../components/ui/PageHeader";
import { PokemonCard } from "../components/ui/PokemonCard";
import { SearchAutocomplete } from "../components/ui/SearchAutocomplete";
import { EmptyState, ErrorBanner, SkeletonCard } from "../components/ui/States";
import { useProfile } from "../context/ProfileContext";

const initialFilters = {
  primaryType: "",
  generation: "",
  legendary: "",
  sortOption: "No.",
};

export default function PokedexPage() {
  const { preferences, setPreference } = useProfile();
  const [searchTerm, setSearchTerm] = useState(preferences.catalogSearch || "");
  const [filters, setFilters] = useState({
    ...initialFilters,
    ...preferences.catalogFilters,
  });
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState(preferences.catalogView || "grid");

  const queryParams = useMemo(
    () => ({
      page,
      perPage: 24,
      searchTerm: searchTerm.trim() || undefined,
      ...filters,
    }),
    [filters, page, searchTerm],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["pokemon", queryParams],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/pokemon`, { params: queryParams })).data,
  });

  const changeFilters = (next) => {
    setFilters(next);
    setPreference("catalogFilters", next);
    setPage(1);
  };
  const onSearch = (next) => {
    setSearchTerm(next);
    setPreference("catalogSearch", next);
    setPage(1);
  };
  const changeMode = (next) => {
    setMode(next);
    setPreference("catalogView", next);
  };

  const items = data?.pokemon || [];

  return (
    <div className="pokedex-page">
      <PageHeader
        eyebrow="National catalog"
        title="Pokédex"
        description="A living field guide sourced from the canonical Pokémon data pipeline."
        actions={
          <div className="view-toggle" aria-label="Card layout">
            <button
              className={mode === "grid" ? "is-active" : ""}
              onClick={() => changeMode("grid")}
              aria-label="Grid view"
            >
              ▦
            </button>
            <button
              className={mode === "list" ? "is-active" : ""}
              onClick={() => changeMode("list")}
              aria-label="List view"
            >
              ☷
            </button>
            <button
              className={mode === "compact" ? "is-active" : ""}
              onClick={() => changeMode("compact")}
              aria-label="Compact view"
            >
              ▤
            </button>
          </div>
        }
      />
      <div className="pokedex-toolbar">
        <SearchAutocomplete
          value={searchTerm}
          onChange={onSearch}
          resultCount={data?.totalPokemon}
        />
        <span className="sync-status" aria-live="polite">
          {isFetching ? "Syncing…" : "Catalog online"}
        </span>
      </div>
      <div className="catalog-layout">
        <FilterPanel
          filters={filters}
          onChange={changeFilters}
          onReset={() => changeFilters(initialFilters)}
        />
        <section aria-label="Pokémon results">
          {isError ? (
            <ErrorBanner
              title="The catalog could not load"
              message={
                error?.response?.data?.error?.message ||
                "Check that the Flask API is running, then try again."
              }
              onRetry={refetch}
            />
          ) : isLoading ? (
            <div className="pokemon-grid">
              {Array.from({ length: 12 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className={`pokemon-grid pokemon-grid--${mode}`}>
                {items.map((entry, index) => (
                  <PokemonCard
                    key={entry._id}
                    entry={entry}
                    mode={mode}
                    index={index}
                  />
                ))}
              </div>
              <nav className="pagination" aria-label="Pokédex pages">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  ← Previous
                </button>
                <span>
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              </nav>
            </>
          ) : (
            <EmptyState title="No Pokémon matched that search">
              Try clearing a filter or search for a shorter name.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
