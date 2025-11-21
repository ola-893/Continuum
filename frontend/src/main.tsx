import React from 'react';
import ReactDOM from 'react-dom/client';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import App from './App';
import './index.css';

const wallets = [
    new PetraWallet(),
    new MartianWallet(),
    new PontemWallet(),
];

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            <App />
        </AptosWalletAdapterProvider>
    </React.StrictMode>,
);
