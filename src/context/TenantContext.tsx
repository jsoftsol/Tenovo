"use client";

import { createContext, useContext } from "react";

type TenantContextType = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: TenantContextType;
}) {
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}