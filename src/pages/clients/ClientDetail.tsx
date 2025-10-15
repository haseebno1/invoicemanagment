import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Building2, MapPin, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { clientService } from "@/services/clientService";
import { invoiceService } from "@/services/invoiceService";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;
    
    try {
      const [clientData, invoicesData] = await Promise.all([
        clientService.getById(id),
        invoiceService.getAll(id).then(data => data.filter((inv: any) => inv.client_id === id))
      ]);
      
      setClient(clientData);
      setInvoices(invoicesData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Client not found</p>
            <Button onClick={() => navigate("/clients")} className="mt-4">
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outstandingBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "default";
      case "Partial": return "secondary";
      case "Unpaid": return "destructive";
      case "Overdue": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.company_name}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/clients/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{client.company_name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {[client.address, client.city, client.country].filter(Boolean).join(", ") || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold">${outstandingBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax ID</p>
              <p>{client.tax_id || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p>{invoices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found for this client
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">{invoice.currency} {Number(invoice.total).toFixed(2)}</p>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
