import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { invoiceService } from "@/services/invoiceService";
import { clientService } from "@/services/clientService";
import { exportService } from "@/services/exportService";
import { analyticsService } from "@/services/analyticsService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("revenue");
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      const data = await analyticsService.getDashboardStats(user.id);
      setAnalytics(data);
      
      // Generate chart data for last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const invoices = await invoiceService.getAll(user.id);
        const monthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.issue_date);
          return invDate >= monthStart && invDate <= monthEnd;
        });
        
        const revenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount.toString()), 0);
        
        months.push({
          month: format(date, 'MMM yyyy'),
          revenue: revenue,
          invoices: monthInvoices.length
        });
      }
      
      setChartData(months);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (reportType === "revenue") {
        const invoices = await invoiceService.getAll(user.id);
        const formatted = exportService.formatInvoicesForExport(invoices);
        exportService.exportToCSV(formatted, "invoices-report");
      } else if (reportType === "client") {
        const clients = await clientService.getAll(user.id);
        const formatted = exportService.formatClientsForExport(clients);
        exportService.exportToCSV(formatted, "clients-report");
      }
      
      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analyze your business performance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="client">Client Analysis</SelectItem>
                  <SelectItem value="tax">Tax Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalRevenue.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.paidInvoices || 0} paid, {analytics?.unpaidInvoices || 0} unpaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.outstandingAmount.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue ($)" />
              <Bar dataKey="invoices" fill="hsl(var(--accent))" name="Invoices" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
