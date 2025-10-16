import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clientService } from "@/services/clientService";
import { invoiceService, InvoiceItem } from "@/services/invoiceService";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
  const [formData, setFormData] = useState({
    client_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "USD",
    tax_rate: 0,
    discount_type: "percentage",
    discount_value: 0,
    deposit_percentage: 0,
    notes: "",
  });

  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { title: "", description: "", quantity: 1, unit_price: 0, discount_type: "percentage", discount_value: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (user) {
      loadClients();
      generateInvoiceNumber();
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
    }
  };

  const generateInvoiceNumber = async () => {
    if (!user) return;
    try {
      const number = await invoiceService.generateInvoiceNumber(user.id);
      setInvoiceNumber(number);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice number",
        variant: "destructive",
      });
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    const item = updated[index];
    const itemTotal = item.quantity * item.unit_price;
    let itemDiscount = 0;
    
    if (item.discount_value) {
      itemDiscount = item.discount_type === "percentage"
        ? itemTotal * (item.discount_value / 100)
        : item.discount_value;
    }
    
    updated[index].amount = itemTotal - itemDiscount;
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { title: "", description: "", quantity: 1, unit_price: 0, discount_type: "percentage", discount_value: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.client_id) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some(item => !item.title || item.quantity <= 0 || item.unit_price < 0)) {
      toast({
        title: "Error",
        description: "Please fill in all line items correctly",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const invoice = await invoiceService.create(user.id, {
        ...formData,
        items: lineItems,
      });
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      navigate(`/invoices/${invoice.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">Fill in the details to create a new invoice</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input value={invoiceNumber} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company_name ? `(${client.company_name})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date *</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency *</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="PKR">PKR (₨)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deposit (%)</Label>
                  <Input
                    type="number"
                    value={formData.deposit_percentage}
                    onChange={(e) => setFormData({ ...formData, deposit_percentage: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Item {index + 1}</span>
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder="Service or product name"
                        value={item.title}
                        onChange={(e) => updateLineItem(index, "title", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Optional description"
                        value={item.description || ""}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 1)}
                          min={1}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          min={0}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          value={item.discount_value || 0}
                          onChange={(e) => updateLineItem(index, "discount_value", parseFloat(e.target.value) || 0)}
                          min={0}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        Item Total: ${item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Payment terms, thank you message, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({formData.tax_rate}%)</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              {formData.deposit_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit ({formData.deposit_percentage}%)</span>
                  <span className="font-medium">${(calculateSubtotal() * formData.deposit_percentage / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
            <Link to="/invoices">
              <Button type="button" variant="ghost" className="w-full">Cancel</Button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
