import { createContext, useContext, type ReactNode } from "react";
import type { DataState } from "@/types";
import { useEventData } from "@/hooks/useEventData";

const DataContext = createContext<DataState | null>(null);

/** Loads + normalizes the dataset once and shares it with the whole tree. */
export function DataProvider({ children }: { children: ReactNode }) {
  const data = useEventData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

/** Module-level memory for the feed scroll position (survives route changes). */
export const feedScroll = { offset: 0 };
