import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
}

export const clientService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Client[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Client;
  },

  async create(userId: string, clientData: CreateClientInput) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        ...clientData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async update(id: string, clientData: Partial<CreateClientInput>) {
    const { data, error } = await supabase
      .from("clients")
      .update(clientData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async search(userId: string, query: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Client[];
  },
};
