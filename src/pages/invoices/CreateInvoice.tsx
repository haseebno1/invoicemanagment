import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateInvoice() {
  const [lineItems, setLineItems] = useState([
    { id: 1, title: "", description: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), title: "", description: "", quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice - item.discount;
      return sum + itemTotal;
    }, 0);
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
                  <Input placeholder="INV-001" value="INV-001" readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add-new">+ Add New Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="pkr">PKR (₨)</SelectItem>
                    </SelectContent>
                  </Select>
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
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Item {index + 1}</span>
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input placeholder="Service or product name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Optional description" rows={2} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" defaultValue={1} min={1} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input type="number" defaultValue={0} min={0} step="0.01" />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount</Label>
                        <Input type="number" defaultValue={0} min={0} step="0.01" />
                      </div>
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
                <span className="text-muted-foreground">Tax (0%)</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">${calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full">Save & Send</Button>
            <Button variant="outline" className="w-full">Save as Draft</Button>
            <Link to="/invoices">
              <Button variant="ghost" className="w-full">Cancel</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
