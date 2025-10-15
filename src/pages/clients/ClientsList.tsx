import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Mail, Phone, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { clientService, Client } from "@/services/clientService";

export default function ClientsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    
    try {
      const data = await clientService.getAll(user.id);
      setClients(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!user) return;

    if (query.trim() === "") {
      loadClients();
      return;
    }

    try {
      const data = await clientService.search(user.id, query);
      setClients(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search clients",
        variant: "destructive",
      });
    }
  };

  const hasClients = clients.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships</p>
        </div>
        <Link to="/clients/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : !hasClients ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first client to start creating invoices
            </p>
            <Link to="/clients/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card 
                key={client.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.company_name && (
                    <p className="text-sm text-muted-foreground">{client.company_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {(client.city || client.country) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{[client.city, client.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
