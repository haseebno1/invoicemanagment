import { supabase } from "@/integrations/supabase/client";

export interface Payment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface CreatePaymentInput {
  invoice_id: string;
  payment_date: string;
  amount: number;
  notes?: string;
}

export const paymentService = {
  async getByInvoiceId(invoiceId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as Payment[];
  },

  async create(paymentData: CreatePaymentInput) {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update invoice paid_amount and balance
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("paid_amount, total")
      .eq("id", paymentData.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

    const newPaidAmount = (invoice.paid_amount || 0) + paymentData.amount;
    const newBalance = invoice.total - newPaidAmount;

    let newStatus = "Unpaid";
    if (newPaidAmount >= invoice.total) {
      newStatus = "Paid";
    } else if (newPaidAmount > 0) {
      newStatus = "Partial";
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      })
      .eq("id", paymentData.invoice_id);

    if (updateError) throw updateError;

    return payment;
  },
};
