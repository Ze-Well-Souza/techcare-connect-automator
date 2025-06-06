
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  type: string;
  address?: string;
  status: string;
  plan_id?: number;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchClients = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setClients(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(errorMessage);
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          document: clientData.document,
          type: clientData.type,
          address: clientData.address,
          status: clientData.status,
          plan_id: clientData.plan_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await fetchClients();
      toast.success('Cliente criado com sucesso!');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await fetchClients();
      toast.success('Cliente atualizado com sucesso!');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        throw new Error(error.message);
      }

      await fetchClients();
      toast.success('Cliente removido com sucesso!');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover cliente';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
};
