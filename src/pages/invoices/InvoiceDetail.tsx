import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, Trash2, DollarSign } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import { pdfService } from "@/services/pdfService";
import { PaymentRecordDialog } from "@/components/PaymentRecordDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    try {
      const [invoiceData, paymentsData] = await Promise.all([
        invoiceService.getById(id),
        paymentService.getByInvoiceId(id),
      ]);
      setInvoice(invoiceData);
      setPayments(paymentsData);
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

  const handleDownloadPDF = () => {
    if (!invoice) return;
    
    const profile = user?.user_metadata;
    pdfService.downloadInvoicePDF(invoice, {
      name: profile?.company_name || profile?.full_name,
      email: profile?.email,
    });
    
    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    });
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      await invoiceService.delete(id);
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      navigate("/invoices");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Invoice not found</p>
            <Button onClick={() => navigate("/invoices")} className="mt-4">
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">{invoice.clients?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.balance > 0 && (
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoice.currency} {Number(invoice.total).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoice.currency} {Number(invoice.balance).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{invoice.clients?.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.clients?.email}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-2">
              {invoice.invoice_items?.map((item: any, index: number) => (
                <div key={item.id || index} className="flex justify-between items-start p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {invoice.currency} {Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">{invoice.currency} {Number(item.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
              <span>{invoice.currency} {Number(invoice.tax_amount).toFixed(2)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>- {invoice.currency} {Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{invoice.currency} {Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">
                      {invoice.currency} {Number(payment.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                    )}
                  </div>
                  <Badge>Paid</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PaymentRecordDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={id!}
        balance={invoice?.balance || 0}
        currency={invoice?.currency || "USD"}
        onSuccess={loadInvoice}
      />
    </div>
  );
}
