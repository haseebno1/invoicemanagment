export const exportService = {
  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue = value === null || value === undefined ? "" : String(value);
            return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  formatInvoicesForExport(invoices: any[]) {
    return invoices.map((invoice) => ({
      "Invoice Number": invoice.invoice_number,
      Client: invoice.clients?.name || "",
      "Issue Date": new Date(invoice.issue_date).toLocaleDateString(),
      "Due Date": new Date(invoice.due_date).toLocaleDateString(),
      Currency: invoice.currency,
      Total: invoice.total,
      Paid: invoice.paid_amount,
      Balance: invoice.balance,
      Status: invoice.status,
    }));
  },

  formatClientsForExport(clients: any[]) {
    return clients.map((client) => ({
      Name: client.name,
      Email: client.email,
      Company: client.company_name || "",
      Phone: client.phone || "",
      City: client.city || "",
      Country: client.country || "",
    }));
  },
};
