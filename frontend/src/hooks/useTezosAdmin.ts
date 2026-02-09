/**
 * Custom hook for Tezos admin functionality
 * Provides admin authorization checks and admin-specific operations
 */

import { useState, useEffect } from 'react';
import { useTezosWallet } from './useTezosWallet';
import * as TezosContract from '../services/tezosContractService';

export interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useTezosAdmin = () => {
  const { address, isConnected } = useTezosWallet();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isConnected || !address) {
        setAdminStatus({
          isAdmin: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setAdminStatus(prev => ({ ...prev, isLoading: true, error: null }));
        const isAdmin = await TezosContract.isAdmin(address);
        setAdminStatus({
          isAdmin,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminStatus({
          isAdmin: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to check admin status',
        });
      }
    };

    checkAdminStatus();
  }, [address, isConnected]);

  return adminStatus;
};
