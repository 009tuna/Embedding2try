import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Documents from "./pages/Documents";
import Matching from "./pages/Matching";
import Categories from "./pages/Categories";
import Rules from "./pages/Rules";
import EmailSources from "./pages/EmailSources";
import ApiExport from "./pages/ApiExport";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/documents" component={Documents} />
        <Route path="/matching" component={Matching} />
        <Route path="/categories" component={Categories} />
        <Route path="/rules" component={Rules} />
        <Route path="/email-sources" component={EmailSources} />
        <Route path="/api-export" component={ApiExport} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
