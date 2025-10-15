-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Unpaid',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit_percentage DECIMAL(5, 2),
  deposit_amount DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value DECIMAL(10, 2),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for tracking invoice payments
CREATE TABLE public.payments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" 
ON public.clients FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
ON public.clients FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for invoice_items (via invoice ownership)
CREATE POLICY "Users can view items of their invoices" 
ON public.invoice_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create items for their invoices" 
ON public.invoice_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items of their invoices" 
ON public.invoice_items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items of their invoices" 
ON public.invoice_items FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

-- RLS Policies for payments
CREATE POLICY "Users can view payments of their invoices" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = payments.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create payments for their invoices" 
ON public.payments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = payments.invoice_id 
    AND invoices.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE user_id = p_user_id;
  
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);