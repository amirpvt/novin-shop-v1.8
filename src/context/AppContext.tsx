import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

type AppContextType = {
  appName: string;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppContext.Provider
      value={{
        appName: "Novin Shop",
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider"
    );
  }

  return context;
}