import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import NewProjects from "./pages/NewProjects";
import NewProjectDetails from "./pages/NewProjectDetails";
import Agents from "./pages/Agents";
import FindMyAgent from "./pages/FindMyAgent";
import AgentCreateStory from "./pages/AgentCreateStory";
import AgentDetails from "./pages/AgentDetails";
import Dashboard from "./pages/admin/Dashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAgentCreate from "./pages/admin/AdminAgentCreate";
import AdminAgentEdit from "./pages/admin/AdminAgentEdit";
import AdminStories from "./pages/admin/AdminStories";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminProjectForm from "./pages/admin/AdminProjectForm";
import AdminPropertyForm from "./pages/admin/AdminPropertyForm";
import AdminContacts from "./pages/admin/AdminContacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:slugOrId" element={<PropertyDetails />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/new-projects" element={<NewProjects />} />
          <Route path="/new-projects/:slug" element={<NewProjectDetails />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetails />} />
          <Route path="/find-agent" element={<FindMyAgent />} />
          <Route path="/agent/stories/new" element={<AgentCreateStory />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/properties" element={<AdminProperties />} />
          <Route path="/admin/properties/new" element={<AdminPropertyForm />} />
          <Route path="/admin/properties/:id/edit" element={<AdminPropertyForm />} />
          <Route path="/admin/agents" element={<AdminAgents />} />
          <Route path="/admin/agents/new" element={<AdminAgentCreate />} />
          <Route path="/admin/agents/:id/edit" element={<AdminAgentEdit />} />
          <Route path="/admin/stories" element={<AdminStories />} />
                          <Route path="/admin/projects" element={<AdminProjects />} />
                          <Route path="/admin/projects/new" element={<AdminProjectForm />} />
                          <Route path="/admin/projects/:id/edit" element={<AdminProjectForm />} />
                          <Route path="/admin/contacts" element={<AdminContacts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
