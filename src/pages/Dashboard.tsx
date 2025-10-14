import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, Clock, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Placeholder data - will be replaced with real data in later phases
  const stats = [
    {
      title: "Total Revenue",
      value: "$0.00",
      icon: DollarSign,
      description: "No invoices yet",
    },
    {
      title: "Outstanding",
      value: "$0.00",
      icon: Clock,
      description: "0 unpaid invoices",
    },
    {
      title: "Total Invoices",
      value: "0",
      icon: FileText,
      description: "Get started below",
    },
    {
      title: "Total Clients",
      value: "0",
      icon: Users,
      description: "Add your first client",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to InvoiceForge</h1>
        <p className="text-muted-foreground">
          Let's get started by creating your first invoice or adding a client
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link to="/invoices/create">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Invoice
          </Button>
        </Link>
        <Link to="/clients/create">
          <Button size="lg" variant="outline">
            <Plus className="mr-2 h-5 w-5" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first invoice to see it here
            </p>
            <Link to="/invoices/create">
              <Button>Create Your First Invoice</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Chart will be displayed here once you have invoice data
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
