import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Building2, MapPin, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - will be replaced with actual data from database
  const client = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    companyName: "Acme Corp",
    address: "123 Business St",
    city: "New York",
    country: "USA",
    taxId: "123456789",
    outstandingBalance: 5000,
  };

  const invoices = [
    { id: "1", number: "INV-001", date: "2024-01-15", amount: 1500, status: "Paid" },
    { id: "2", number: "INV-002", date: "2024-02-01", amount: 2500, status: "Partial" },
    { id: "3", number: "INV-003", date: "2024-02-15", amount: 1000, status: "Unpaid" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.companyName}</p>
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
              <span>{client.companyName}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.address}, {client.city}, {client.country}</span>
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
              <p className="text-2xl font-bold">${client.outstandingBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax ID</p>
              <p>{client.taxId}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                  <Badge variant={invoice.status === "Paid" ? "default" : invoice.status === "Partial" ? "secondary" : "destructive"}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
