import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import InvoicesList from "./pages/invoices/InvoicesList";
import CreateInvoice from "./pages/invoices/CreateInvoice";
import ClientsList from "./pages/clients/ClientsList";
import CreateClient from "./pages/clients/CreateClient";
import EditClient from "./pages/clients/EditClient";
import ClientDetail from "./pages/clients/ClientDetail";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected App Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><AppLayout><InvoicesList /></AppLayout></ProtectedRoute>} />
              <Route path="/invoices/create" element={<ProtectedRoute><AppLayout><CreateInvoice /></AppLayout></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><AppLayout><ClientsList /></AppLayout></ProtectedRoute>} />
              <Route path="/clients/create" element={<ProtectedRoute><AppLayout><CreateClient /></AppLayout></ProtectedRoute>} />
              <Route path="/clients/:id" element={<ProtectedRoute><AppLayout><ClientDetail /></AppLayout></ProtectedRoute>} />
              <Route path="/clients/:id/edit" element={<ProtectedRoute><AppLayout><EditClient /></AppLayout></ProtectedRoute>} />
              <Route path="/invoices/:id" element={<ProtectedRoute><AppLayout><InvoiceDetail /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
