"use client";

import { createContext, useContext } from "react";
import UserType from "@/types/user";
import MembershipType from "@/types/membership";

type AppContextType = {
  user: UserType;
  membership: MembershipType,
  memberships: MembershipType[];
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AppContextType;
}) {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}