// NetworkContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { bsc, bscTestnet } from 'wagmi/chains';

type Network = 'bsc' | 'bscTestnet';

interface NetworkContextType {
    network: Network;
    setNetwork: (network: Network) => void;
    chain: typeof bsc | typeof bscTestnet;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [network, setNetwork] = useState<Network>('bscTestnet');

    const chain = network === 'bsc' ? bsc : bscTestnet;

    return (
        <NetworkContext.Provider value={{ network, setNetwork, chain }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
