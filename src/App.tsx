
import { BrowserRouter } from "react-router-dom";
import { Routes } from "@/Routes";
import { ThemeProvider } from "@/contexts/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { MockModeProvider } from "@/contexts/MockModeContext";
import { Toaster as SonnerToaster } from "sonner";
import { MockModeToggle } from "./components/MockModeToggle";

function App() {
  return (
    <ThemeProvider>
      <MockModeProvider>
        <ConnectionProvider>
          <BrowserRouter>
            <Routes />
            <div className="fixed top-4 right-4 z-50">
              <MockModeToggle />
            </div>
            <Toaster />
            <SonnerToaster position="top-center" />
          </BrowserRouter>
        </ConnectionProvider>
      </MockModeProvider>
    </ThemeProvider>
  );
}

export default App;
