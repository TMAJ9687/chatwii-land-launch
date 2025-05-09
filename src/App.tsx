
import { BrowserRouter } from "react-router-dom";
import { Routes } from "@/Routes";
import { ThemeProvider } from "@/contexts/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { MockModeProvider } from "@/contexts/MockModeContext";
import { Toaster as SonnerToaster } from "sonner";
import { MockModeToggle } from "./components/MockModeToggle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a React Query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

function App() {
  return (
    <ThemeProvider>
      <MockModeProvider>
        <ConnectionProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Routes />
              <div className="fixed top-4 right-4 z-50">
                <MockModeToggle />
              </div>
              <Toaster />
              <SonnerToaster position="top-center" />
            </BrowserRouter>
          </QueryClientProvider>
        </ConnectionProvider>
      </MockModeProvider>
    </ThemeProvider>
  );
}

export default App;
