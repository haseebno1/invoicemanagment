import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";

export default function InvoicesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, activeTab, searchQuery]);

  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      const data = await invoiceService.getAll(user.id);
      setInvoices(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (activeTab !== "all") {
      filtered = filtered.filter((inv) => inv.status.toLowerCase() === activeTab);
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid": return <Badge variant="default">Paid</Badge>;
      case "Partial": return <Badge variant="secondary">Partial</Badge>;
      case "Unpaid": return <Badge variant="destructive">Unpaid</Badge>;
      case "Overdue": return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasInvoices = invoices.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Link to="/invoices/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : !hasInvoices ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-6">Create your first invoice to start tracking payments</p>
            <Link to="/invoices/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="partial">Partial</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No invoices found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => (
                    <Card key={invoice.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{invoice.clients?.name || "Unknown Client"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                            <p className="font-semibold">{invoice.currency} {Number(invoice.total).toFixed(2)}</p>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
