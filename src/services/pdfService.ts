import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoicePDFData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  balance: number;
  notes?: string;
  clients: {
    name: string;
    email: string;
    company_name?: string;
    address?: string;
    phone?: string;
  };
  invoice_items: Array<{
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export const pdfService = {
  generateInvoicePDF(invoiceData: InvoicePDFData, companyInfo?: { name?: string; email?: string }) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 20, 20);

    // Company Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (companyInfo?.name) {
      doc.text(companyInfo.name, 20, 30);
    }
    if (companyInfo?.email) {
      doc.text(companyInfo.email, 20, 35);
    }

    // Invoice Details
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice #: ${invoiceData.invoice_number}`, 120, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Issue Date: ${new Date(invoiceData.issue_date).toLocaleDateString()}`, 120, 25);
    doc.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, 120, 30);
    doc.text(`Status: ${invoiceData.status}`, 120, 35);

    // Client Info
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.clients.name, 20, 55);
    if (invoiceData.clients.company_name) {
      doc.text(invoiceData.clients.company_name, 20, 60);
    }
    doc.text(invoiceData.clients.email, 20, 65);
    if (invoiceData.clients.phone) {
      doc.text(invoiceData.clients.phone, 20, 70);
    }
    if (invoiceData.clients.address) {
      doc.text(invoiceData.clients.address, 20, 75);
    }

    // Line Items Table
    const tableData = invoiceData.invoice_items.map((item) => [
      item.title,
      item.description || "",
      item.quantity.toString(),
      `${invoiceData.currency} ${item.unit_price.toFixed(2)}`,
      `${invoiceData.currency} ${item.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Item", "Description", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    const totalsX = 120;
    let totalsY = finalY + 10;

    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(`${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`, 170, totalsY, { align: "right" });
    
    totalsY += 6;
    doc.text(`Tax (${invoiceData.tax_rate}%):`, totalsX, totalsY);
    doc.text(`${invoiceData.currency} ${invoiceData.tax_amount.toFixed(2)}`, 170, totalsY, { align: "right" });

    if (invoiceData.discount_amount > 0) {
      totalsY += 6;
      doc.text("Discount:", totalsX, totalsY);
      doc.text(`-${invoiceData.currency} ${invoiceData.discount_amount.toFixed(2)}`, 170, totalsY, { align: "right" });
    }

    totalsY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total:", totalsX, totalsY);
    doc.text(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, 170, totalsY, { align: "right" });

    totalsY += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Paid:", totalsX, totalsY);
    doc.text(`${invoiceData.currency} ${invoiceData.paid_amount.toFixed(2)}`, 170, totalsY, { align: "right" });

    totalsY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Balance Due:", totalsX, totalsY);
    doc.text(`${invoiceData.currency} ${invoiceData.balance.toFixed(2)}`, 170, totalsY, { align: "right" });

    // Notes
    if (invoiceData.notes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Notes:", 20, totalsY + 15);
      const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(splitNotes, 20, totalsY + 20);
    }

    return doc;
  },

  downloadInvoicePDF(invoiceData: InvoicePDFData, companyInfo?: { name?: string; email?: string }) {
    const doc = this.generateInvoicePDF(invoiceData, companyInfo);
    doc.save(`invoice-${invoiceData.invoice_number}.pdf`);
  },
};
