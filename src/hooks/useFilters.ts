import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterState, RegistrationFilter, SortKey } from "@/types";
import { DEFAULT_FILTERS } from "@/utils/constants";

const SORT_VALUES: SortKey[] = ["date-asc", "date-desc", "name-asc", "popularity-desc"];
const REG_VALUES: RegistrationFilter[] = ["all", "registered", "not-registered", "available"];

/**
 * Filter state synchronized to the URL query string, so any view (and link)
 * is fully shareable and restorable. Reading derives `FilterState` from the
 * params; writing patches the params (which re-renders with new state).
 */
export function useFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<FilterState>(() => {
    const list = (key: string) =>
      params.get(key)?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    const sortParam = params.get("sort") as SortKey | null;
    return {
      search: params.get("q") ?? "",
      categories: list("cat"),
      organizers: list("org"),
      tags: list("tag"),
      venues: list("venue"),
      dateFrom: params.get("from") ?? "",
      dateTo: params.get("to") ?? "",
      sort: sortParam && SORT_VALUES.includes(sortParam) ? sortParam : "date-asc",
      hideCancelled: params.get("cancelled") === "0",
      registration: ((): RegistrationFilter => {
        const r = params.get("reg") as RegistrationFilter | null;
        return r && REG_VALUES.includes(r) ? r : "all";
      })(),
    };
  }, [params]);

  const patch = useCallback(
    (next: Partial<FilterState>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const setList = (key: string, arr: string[] | undefined) => {
            if (arr === undefined) return;
            if (arr.length) p.set(key, arr.join(","));
            else p.delete(key);
          };
          const setVal = (key: string, val: string | undefined) => {
            if (val === undefined) return;
            if (val) p.set(key, val);
            else p.delete(key);
          };

          if ("search" in next) setVal("q", next.search);
          setList("cat", next.categories);
          setList("org", next.organizers);
          setList("tag", next.tags);
          setList("venue", next.venues);
          if ("dateFrom" in next) setVal("from", next.dateFrom);
          if ("dateTo" in next) setVal("to", next.dateTo);
          if ("sort" in next) {
            if (next.sort && next.sort !== "date-asc") p.set("sort", next.sort);
            else p.delete("sort");
          }
          if ("hideCancelled" in next) {
            if (next.hideCancelled) p.set("cancelled", "0");
            else p.delete("cancelled");
          }
          if ("registration" in next) {
            if (next.registration && next.registration !== "all") p.set("reg", next.registration);
            else p.delete("reg");
          }
          return p;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const toggleInArray = useCallback(
    (key: "categories" | "organizers" | "tags" | "venues", value: string) => {
      const current = filters[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      patch({ [key]: next } as Partial<FilterState>);
    },
    [filters, patch]
  );

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const activeCount =
    filters.categories.length +
    filters.organizers.length +
    filters.tags.length +
    filters.venues.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.hideCancelled ? 1 : 0) +
    (filters.registration !== "all" ? 1 : 0);

  const isDefault =
    activeCount === 0 && filters.search === "" && filters.sort === DEFAULT_FILTERS.sort;

  return { filters, patch, toggleInArray, reset, activeCount, isDefault };
}
