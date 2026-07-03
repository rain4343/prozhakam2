import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

// Pages
import Dashboard from "@/pages/dashboard";
import AssetsList from "@/pages/assets/list";
import AssetForm from "@/pages/assets/form";
import DepartmentsList from "@/pages/departments";
import UsersList from "@/pages/users";
import RolesList from "@/pages/roles";
import DocumentsList from "@/pages/documents/list";
import DocumentShow from "@/pages/documents/show";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/assets" component={AssetsList} />
      <Route path="/assets/new" component={AssetForm} />
      <Route path="/assets/:id" component={AssetForm} />
      <Route path="/departments" component={DepartmentsList} />
      <Route path="/users" component={UsersList} />
      <Route path="/roles" component={RolesList} />
      <Route path="/documents" component={DocumentsList} />
      <Route path="/documents/:id" component={DocumentShow} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
