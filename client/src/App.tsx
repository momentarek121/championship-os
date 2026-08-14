import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PublicRegistration from "./pages/PublicRegistration";
import AthletePortal from "@/pages/AthletePortal";
import PublicParticipants from "@/pages/PublicParticipants";
import PublicInfo from "@/pages/PublicInfo";
import DemoBrackets from "@/pages/DemoBrackets";
import RefereeDesk from "@/pages/RefereeDesk";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/register/:slug"} component={PublicRegistration} />
      <Route path={"/athlete/:slug"} component={AthletePortal} />
      <Route path={"/event/:slug/participants"} component={PublicParticipants} />
      <Route path={"/demo/brackets"} component={DemoBrackets} />
      <Route path={"/referee"} component={RefereeDesk} />
      <Route path={"/rankings"}>{() => <PublicInfo section="rankings" />}</Route>
      <Route path={"/athletes"}>{() => <PublicInfo section="athletes" />}</Route>
      <Route path={"/membership"}>{() => <PublicInfo section="membership" />}</Route>
      <Route path={"/news"}>{() => <PublicInfo section="news" />}</Route>
      <Route path={"/regulations"}>{() => <PublicInfo section="regulations" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
