import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalClients: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export const analyticsService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("status, total, paid_amount, balance, due_date")
      .eq("user_id", userId);

    if (invoicesError) throw invoicesError;

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId);

    if (clientsError) throw clientsError;

    const stats: DashboardStats = {
      totalRevenue: 0,
      outstandingAmount: 0,
      totalInvoices: invoices?.length || 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0,
      totalClients: clients?.length || 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices?.forEach((invoice) => {
      stats.totalRevenue += invoice.paid_amount || 0;
      stats.outstandingAmount += invoice.balance || 0;

      if (invoice.status === "Paid") {
        stats.paidInvoices++;
      } else if (invoice.status === "Unpaid") {
        stats.unpaidInvoices++;
        const dueDate = new Date(invoice.due_date);
        if (dueDate < today) {
          stats.overdueInvoices++;
        }
      } else if (invoice.status === "Partial") {
        stats.unpaidInvoices++;
      }
    });

    return stats;
  },

  async getRevenueByMonth(userId: string, months: number = 6): Promise<RevenueByMonth[]> {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("paid_amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const revenueMap: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    invoices?.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      revenueMap[monthKey] = (revenueMap[monthKey] || 0) + (invoice.paid_amount || 0);
    });

    return Object.entries(revenueMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-months);
  },

  async getRecentInvoices(userId: string, limit: number = 5) {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          email
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};
