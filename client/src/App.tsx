import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
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
import AdminPanel from "./pages/AdminPanel";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Home} />
        <Route path="/documents" component={Documents} />
        <Route path="/matching" component={Matching} />
        <Route path="/categories" component={Categories} />
        <Route path="/rules" component={Rules} />
        <Route path="/email-sources" component={EmailSources} />
        <Route path="/api-export" component={ApiExport} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/admin" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/documents" component={DashboardRouter} />
      <Route path="/matching" component={DashboardRouter} />
      <Route path="/categories" component={DashboardRouter} />
      <Route path="/rules" component={DashboardRouter} />
      <Route path="/email-sources" component={DashboardRouter} />
      <Route path="/api-export" component={DashboardRouter} />
      <Route path="/reports" component={DashboardRouter} />
      <Route path="/settings" component={DashboardRouter} />
      <Route path="/admin" component={DashboardRouter} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
