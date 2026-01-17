import { useEffect, useState } from 'react';

interface LuffaAccount {
  address: string;
  username: string;
  avatar: string;
}

interface LuffaSDK {
  getAccount(): Promise<LuffaAccount>;
  sendTransaction(params: {
    to: string;
    data: string;
    value: string;
  }): Promise<{ hash: string }>;
  setShareInfo(info: {
    title: string;
    description: string;
    imageUrl: string;
    path: string;
  }): void;
  on(event: string, callback: (data: any) => void): void;
}

declare global {
  interface Window {
    luffa?: LuffaSDK;
  }
}

export function useLuffa() {
  const [account, setAccount] = useState<LuffaAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initLuffa();
  }, []);

  const initLuffa = async () => {
    try {
      // 检查 Luffa SDK 是否存在
      if (typeof window.luffa === 'undefined') {
        throw new Error('Luffa SDK not found. Please open in Luffa App.');
      }

      // 获取账户信息
      const accountInfo = await window.luffa.getAccount();
      setAccount(accountInfo);
      setIsConnected(true);

      // 监听账户变化
      window.luffa.on('accountChanged', (newAccount: LuffaAccount) => {
        console.log('Account changed:', newAccount);
        setAccount(newAccount);
      });
    } catch (err) {
      console.error('Failed to initialize Luffa:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async (params: {
    to: string;
    data: string;
    value: string;
  }) => {
    try {
      if (!window.luffa) {
        throw new Error('Luffa SDK not available');
      }

      const tx = await window.luffa.sendTransaction(params);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('Transaction failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  };

  const setShareInfo = (info: {
    title: string;
    description: string;
    imageUrl: string;
    path: string;
  }) => {
    if (window.luffa) {
      window.luffa.setShareInfo(info);
    }
  };

  return {
    account,
    isConnected,
    isLoading,
    error,
    sendTransaction,
    setShareInfo,
  };
}
