import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clientService } from "@/services/clientService";
import { invoiceService, InvoiceItem } from "@/services/invoiceService";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    client_id: "",
    issue_date: "",
    due_date: "",
    currency: "USD",
    tax_rate: 0,
    notes: "",
  });

  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    if (!user || !id) return;
    
    try {
      const [invoiceData, clientsData] = await Promise.all([
        invoiceService.getById(id),
        clientService.getAll(user.id),
      ]);
      
      setInvoice(invoiceData);
      setClients(clientsData);
      setFormData({
        client_id: invoiceData.client_id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        currency: invoiceData.currency,
        tax_rate: invoiceData.tax_rate,
        notes: invoiceData.notes || "",
      });
      setLineItems(invoiceData.invoice_items || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    const item = updated[index];
    const itemTotal = item.quantity * item.unit_price;
    updated[index].amount = itemTotal;
    
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { title: "", description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) return;

    setSaving(true);
    try {
      await invoiceService.update(id, {
        ...formData,
        items: lineItems,
      });
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      
      navigate(`/invoices/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Invoice</h1>
          <p className="text-muted-foreground">{invoice?.invoice_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/invoices/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
