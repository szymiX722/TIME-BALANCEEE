import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { useAppStore } from "@/hooks/useAppStore";
import { useEffect } from "react";
import { BACKGROUND_STYLES } from "@/types";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Quests from "./pages/Quests";
import Shop from "./pages/Shop";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const store = useAppStore();

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', store.state.user.darkMode);
  }, [store.state.user.darkMode]);

  // Apply active background
  useEffect(() => {
    const bg = store.state.user.activeBackground;
    const style = BACKGROUND_STYLES[bg] || 'none';
    if (style === 'none') {
      document.body.style.backgroundImage = '';
      document.body.style.background = '';
    } else {
      document.body.style.backgroundImage = style;
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundSize = bg === 'dots' ? '20px 20px' : 'cover';
    }
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
    };
  }, [store.state.user.activeBackground]);

  return (
    <>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard store={store} />} />
          <Route path="/stats" element={<Stats store={store} />} />
          <Route path="/quests" element={<Quests store={store} />} />
          <Route path="/shop" element={<Shop store={store} />} />
          <Route path="/settings" element={<SettingsPage store={store} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
