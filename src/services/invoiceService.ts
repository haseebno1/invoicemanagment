import { supabase } from "@/integrations/supabase/client";

export interface InvoiceItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_type?: string;
  discount_value?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  deposit_percentage?: number;
  deposit_amount?: number;
  total: number;
  paid_amount: number;
  balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    email: string;
    company_name?: string;
  };
}

export interface CreateInvoiceInput {
  client_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  discount_type?: string;
  discount_value?: number;
  deposit_percentage?: number;
  notes?: string;
  items: InvoiceItem[];
}

export const invoiceService = {
  async generateInvoiceNumber(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc("generate_invoice_number", {
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          email,
          company_name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (*),
        invoice_items (*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(userId: string, invoiceData: CreateInvoiceInput) {
    const invoiceNumber = await this.generateInvoiceNumber(userId);

    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (invoiceData.tax_rate / 100);
    
    let discountAmount = 0;
    if (invoiceData.discount_value) {
      discountAmount = invoiceData.discount_type === "percentage"
        ? subtotal * (invoiceData.discount_value / 100)
        : invoiceData.discount_value;
    }

    const depositAmount = invoiceData.deposit_percentage
      ? subtotal * (invoiceData.deposit_percentage / 100)
      : undefined;

    const total = subtotal + taxAmount - discountAmount;
    const balance = total;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        client_id: invoiceData.client_id,
        invoice_number: invoiceNumber,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        currency: invoiceData.currency,
        subtotal,
        tax_rate: invoiceData.tax_rate,
        tax_amount: taxAmount,
        discount_type: invoiceData.discount_type,
        discount_value: invoiceData.discount_value,
        discount_amount: discountAmount,
        deposit_percentage: invoiceData.deposit_percentage,
        deposit_amount: depositAmount,
        total,
        balance,
        notes: invoiceData.notes,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const itemsToInsert = invoiceData.items.map((item) => ({
      invoice_id: invoice.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return invoice;
  },

  async update(id: string, invoiceData: Partial<CreateInvoiceInput>) {
    // If items are being updated, we need to recalculate totals
    if (invoiceData.items) {
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * ((invoiceData.tax_rate || 0) / 100);
      
      let discountAmount = 0;
      if (invoiceData.discount_value) {
        discountAmount = invoiceData.discount_type === "percentage"
          ? subtotal * (invoiceData.discount_value / 100)
          : invoiceData.discount_value;
      }

      const total = subtotal + taxAmount - discountAmount;

      // Delete existing items
      await supabase.from("invoice_items").delete().eq("invoice_id", id);

      // Insert new items
      const itemsToInsert = invoiceData.items.map((item) => ({
        invoice_id: id,
        ...item,
      }));

      await supabase.from("invoice_items").insert(itemsToInsert);

      // Update invoice
      const { data, error } = await supabase
        .from("invoices")
        .update({
          client_id: invoiceData.client_id,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          currency: invoiceData.currency,
          subtotal,
          tax_rate: invoiceData.tax_rate,
          tax_amount: taxAmount,
          discount_type: invoiceData.discount_type,
          discount_value: invoiceData.discount_value,
          discount_amount: discountAmount,
          total,
          balance: total,
          notes: invoiceData.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Simple update without items
    const { data, error } = await supabase
      .from("invoices")
      .update(invoiceData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStatistics(userId: string) {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("status, total, paid_amount")
      .eq("user_id", userId);

    if (error) throw error;

    const stats = {
      totalRevenue: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      partialInvoices: 0,
      overdueInvoices: 0,
    };

    invoices.forEach((invoice) => {
      stats.totalRevenue += invoice.paid_amount || 0;
      
      switch (invoice.status) {
        case "Paid":
          stats.paidInvoices++;
          break;
        case "Unpaid":
          stats.unpaidInvoices++;
          break;
        case "Partial":
          stats.partialInvoices++;
          break;
        case "Overdue":
          stats.overdueInvoices++;
          break;
      }
    });

    return stats;
  },
};
