"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types/fly-in";

type DemoContextValue = {
  chats: Record<string, ChatMessage[]>;
  addMessage: (id: string, text: string) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const welcomeMessage: ChatMessage = { author: "Mia", text: "Heads up: west ramp is open after 6:00. See you there!", mine: false };

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  const value = useMemo(() => ({
    chats,
    addMessage: (id: string, text: string) => setChats((current) => ({ ...current, [id]: [...(current[id] ?? [welcomeMessage]), { author: "You", text, mine: true }] })),
  }), [chats]);

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
