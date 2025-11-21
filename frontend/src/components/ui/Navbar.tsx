import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Infinity } from 'lucide-react';
import { Badge } from './Badge';
import { truncateAddress } from '../../utils/formatting';
import { useContinuum } from '../../hooks/useContinuum';

export const Navbar: React.FC = () => {
    const { account, connected } = useWallet();
    const { complianceStatus } = useContinuum();

    return (
        <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="container">
                <div className="flex justify-between items-center" style={{ height: '70px' }}>
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-md">
                        <Infinity
                            size={32}
                            className="animate-float"
                            style={{ color: 'var(--color-primary)' }}
                        />
                        <span className="text-2xl font-bold gradient-text">Continuum</span>
                    </Link>

                    {/* Wallet Connection */}
                    <div className="flex items-center gap-md">
                        {connected && account ? (
                            <>
                                <div className="flex items-center gap-sm">
                                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                                        {account.address.slice(2, 4).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {truncateAddress(account.address)}
                                        </span>
                                        {complianceStatus.hasKYC ? (
                                            <Badge variant="success" showIcon={true}>
                                                KYC Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="warning" showIcon={true}>
                                                No KYC
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <WalletSelector />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
