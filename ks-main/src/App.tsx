import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Tienda from "./pages/Tienda";
import Perfil from "./pages/Perfil";
import Eloboost from "./pages/Eloboost";
import Checkout from "./pages/Checkout";
import EloboostCheckout from "./pages/EloboostCheckout";
import Admin from "./pages/Admin";
import Unrankeds from "./pages/Unrankeds.jsx";
import { CurrencyProvider } from './context/currencyContext.jsx'
import {AuthModalProvider} from './context/authModalContext'
import {DeviceProvider} from './context/deviceContext.jsx'
import {NotificationsProvider} from './context/notificationContext.jsx'
import Recompensas from "./pages/Recompensas.jsx";
import TiendaGold from "./pages/TiendaGold.jsx";
import {EmailVerification} from "./pages/EmailVerification.jsx";
import Privacy from "./pages/Privacy.jsx";
import {ResetPassword} from "./pages/ResetPassword.jsx"
import Lootboxes from "./pages/Lootboxes.jsx"
import Cupones from "./pages/Cupones.jsx"
import CasePage from "./pages/CasePage.jsx"
import LootboxRoulette from "./pages/LootboxRoulette.jsx"
import Terms from "./pages/Terms.jsx"
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
                    <Route path="/eloboost-checkout" element={<EloboostCheckout />} />
                    <Route path="/comprar" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/tiendaOro/:category" element={<TiendaGold />} />
                    <Route path="/recompensas" element={<Recompensas />} />
                    <Route path="/unrankeds" element={<Unrankeds />} />
                    <Route path="/verify/:token" element={<EmailVerification />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/lootboxes" element={<Lootboxes />} />
                    <Route path="/cupones" element={<Cupones />} />
                    <Route path="/cases/:id" element={<CasePage />} />
                    <Route path="/test" element={<LootboxRoulette lootboxId={'67a52186c0610727c6fd5cfd'} />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
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