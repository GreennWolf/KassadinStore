import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Tienda from "./pages/Tienda";
import Perfil from "./pages/Perfil";
import Eloboost from "./pages/Eloboost";
import Checkout from "./pages/Checkout.jsx";
import Admin from "./pages/Admin";
import Unrankeds from "./pages/Unrankeds";
import { CurrencyProvider } from './context/currencyContext.jsx'
import {AuthModalProvider} from './context/authModalContext'
import {DeviceProvider} from './context/deviceContext.jsx'
import {NotificationsProvider} from './context/notificationContext.jsx'
import Recompensas from "./pages/Recompensas.jsx";
import TiendaGold from "./pages/TiendaGold.jsx";


const queryClient = new QueryClient();

const App = () => (
  <StoreProvider>
    <CurrencyProvider>
      <AuthModalProvider>
        <NotificationsProvider>
          <DeviceProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <TooltipProvider>
                  <Toaster />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/tienda/:category" element={<Tienda />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/eloboost" element={<Eloboost />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/tiendaOro/:category" element={<TiendaGold />} />
                    <Route path="/recompensas" element={<Recompensas />} />
                    <Route path="/unrankeds" element={<Unrankeds />} />
                  </Routes>
                </TooltipProvider>
              </BrowserRouter>
            </QueryClientProvider>
          </DeviceProvider>
        </NotificationsProvider>
      </AuthModalProvider>
    </CurrencyProvider>
  </StoreProvider>
);

export default App;