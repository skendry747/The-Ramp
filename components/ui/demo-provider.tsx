"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types/fly-in";

type Profile = { name: string; home: string; bio: string; aircraft: string };
type DemoContextValue = {
  joinedIds: Set<string>;
  toggleJoin: (id: string) => void;
  chats: Record<string, ChatMessage[]>;
  addMessage: (id: string, text: string) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const welcomeMessage: ChatMessage = { author: "Mia", text: "Heads up: west ramp is open after 6:00. See you there!", mine: false };

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [profile, setProfile] = useState<Profile>({ name: "Shane Kendry", home: "KADS · Addison", bio: "Weekend pilot, always up for a new route and a good ramp conversation.", aircraft: "Cessna 172 Skyhawk" });

  const value = useMemo(() => ({
    joinedIds,
    toggleJoin: (id: string) => setJoinedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    }),
    chats,
    addMessage: (id: string, text: string) => setChats((current) => ({ ...current, [id]: [...(current[id] ?? [welcomeMessage]), { author: "You", text, mine: true }] })),
    profile,
    setProfile,
  }), [chats, joinedIds, profile]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}

export function useDemoChat(id: string) {
  const { chats } = useDemo();
  return chats[id] ?? [welcomeMessage];
}
