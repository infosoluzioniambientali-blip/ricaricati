import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import HomeSoloSingole from "./pages/HomeSoloSingole";
import Acquista from "./pages/Acquista";
import Portale from "./pages/Portale";
import Admin from "./pages/Admin";
import Registrazione from "./pages/Registrazione";
import Dashboard from "./pages/Dashboard";
import Listino from "./pages/Listino";
import ListinoRiservato from "./pages/ListinoRiservato";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TerminiCondizioni from "./pages/TerminiCondizioni";
import NoteLegali from "./pages/NoteLegali";
// Sezioni legacy da rifare - rimosse temporaneamente
import CercaInstallatori from "./pages/CercaInstallatori";
import OppportunitaFotovoltaico from "./pages/OppportunitaFotovoltaico";
// import OppportunitaFotovoltaico from "./pages/OpportunitaFotovoltaico";
import CookieBanner from "./components/CookieBanner";
import Partner from "./pages/Partner";
import OffertaPersonalizzata from "./pages/OffertaPersonalizzata";
import Ingrosso from "./pages/Ingrosso";
import Premi from "./pages/Premi";
import Promo from "./pages/Promo";
import PackBenvenuto from "./pages/PackBenvenuto";
import ChiSiamo from "./pages/ChiSiamo";
import Register from "./pages/Register";
import RecuperaPassword from "./pages/RecuperaPassword";
import VisioneListino from "./pages/VisioneListino";
import MettiListino from "./pages/MettiListino";
import PraticaOmaggio from "./pages/PraticaOmaggio";

function HomeWrapper() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: installatoreData } = trpc.installatori.mio.useQuery(undefined, { enabled: isAuthenticated });
  const isSoloSingole = isAuthenticated && installatoreData?.tipoInterfaccia === "solo_singole";
  
  if (loading) return null;
  return isSoloSingole ? <HomeSoloSingole /> : <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeWrapper} />
      <Route path="/acquista" component={Acquista} />
      <Route path="/portale" component={Portale} />
      <Route path="/register" component={Register} />
      <Route path="/recupera-password" component={RecuperaPassword} />
      <Route path="/portale/registrazione" component={Registrazione} />
      <Route path="/portale/dashboard" component={Dashboard} />
      <Route path="/listino" component={Listino} />
      <Route path="/listino-riservato" component={ListinoRiservato} />
      <Route path="/offerta/:token" component={OffertaPersonalizzata} />
      <Route path="/premi" component={Premi} />
      <Route path="/promo" component={Promo} />
      <Route path="/pack-benvenuto" component={PackBenvenuto} />
      <Route path="/chi-siamo" component={ChiSiamo} />
      <Route path="/visione-listino" component={VisioneListino} />
      <Route path="/metti-listino" component={MettiListino} />
      <Route path="/pratica-omaggio" component={PraticaOmaggio} />
      <Route path="/admin" component={Admin} />
      {/* Pagine legali/>
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/termini-condizioni" component={TerminiCondizioni} />
      <Route path="/note-legali" component={NoteLegali} />
      {/* Sezioni legacy da rifare - rimosse temporaneamente */}
      <Route path="/cerca-installatori" component={CercaInstallatori} />
      <Route path="/opportunita-fotovoltaico" component={OppportunitaFotovoltaico} />
      <Route path="/partner" component={Partner} />
      <Route path="/ingrosso" component={Ingrosso} />
      <Route path="/home">{() => { window.location.replace("/"); return null; }}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
