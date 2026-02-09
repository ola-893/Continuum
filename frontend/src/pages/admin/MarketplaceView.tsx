/**
 * Marketplace View Component
 * Displays all registered RWA tokens from the token registry
 * with pagination and filtering by asset type
 */

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Home, Car, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useTezosWallet } from '../../hooks/useTezosWallet';
import * as TezosContract from '../../services/tezosContractService';
import { formatAddress } from '../../services/tezosContractService';

interface TokenEntry {
    tokenAddress: string;
    assetType: number;
    streamId: number;
    metadataUri: string;
    registrationTime: Date;
}

export const MarketplaceView: React.FC = () => {
    const { isConnected } = useTezosWallet();
    const [tokens, setTokens] = useState<TokenEntry[]>([]);
    const [filteredTokens, setFilteredTokens] = useState<TokenEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssetType, setSelectedAssetType] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchTokens = async () => {
            if (!isConnected) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Get total token count
                const count = await TezosContract.getTokenCount();
                setTotalCount(count);

                // Note: In production, this would use TzKT API or indexer
                // to query all tokens from the token_registry big_map
                // For now, we'll show a message about indexer integration
                
                setTokens([]);
                setFilteredTokens([]);
            } catch (error) {
                console.error('Error fetching tokens:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTokens();
    }, [isConnected]);

    // Filter tokens based on search and asset type
    useEffect(() => {
        let filtered = tokens;

        if (searchTerm) {
            filtered = filtered.filter(token =>
                token.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedAssetType !== null) {
            filtered = filtered.filter(token => token.assetType === selectedAssetType);
        }

        setFilteredTokens(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [tokens, searchTerm, selectedAssetType]);

    const getAssetTypeIcon = (type: number) => {
        switch (type) {
            case TezosContract.AssetType.REAL_ESTATE:
                return <Home size={20} />;
            case TezosContract.AssetType.VEHICLES:
                return <Car size={20} />;
            case TezosContract.AssetType.COMMODITIES:
                return <Package size={20} />;
            default:
                return <Package size={20} />;
        }
    };

    const getAssetTypeName = (type: number) => {
        switch (type) {
            case TezosContract.AssetType.REAL_ESTATE:
                return 'Real Estate';
            case TezosContract.AssetType.VEHICLES:
                return 'Vehicle';
            case TezosContract.AssetType.COMMODITIES:
                return 'Commodities';
            default:
                return 'Unknown';
        }
    };

    const getAssetTypeColor = (type: number) => {
        switch (type) {
            case TezosContract.AssetType.REAL_ESTATE:
                return 'success';
            case TezosContract.AssetType.VEHICLES:
                return 'info';
            case TezosContract.AssetType.COMMODITIES:
                return 'warning';
            default:
                return 'secondary';
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTokens = filteredTokens.slice(startIndex, endIndex);

    if (loading) {
        return <LoadingScreen message="Loading marketplace from blockchain..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Marketplace</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Browse all registered RWA tokens ({totalCount} total)
                </p>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <div className="grid grid-cols-2 gap-lg">
                    {/* Search */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                            Search by Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: 'var(--spacing-sm)',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search token address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', paddingLeft: 'var(--spacing-2xl)' }}
                            />
                        </div>
                    </div>

                    {/* Asset Type Filter */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                            Filter by Asset Type
                        </label>
                        <select
                            className="input"
                            value={selectedAssetType ?? ''}
                            onChange={(e) => setSelectedAssetType(e.target.value ? parseInt(e.target.value) : null)}
                            style={{ width: '100%' }}
                        >
                            <option value="">All Types</option>
                            <option value={TezosContract.AssetType.REAL_ESTATE}>Real Estate</option>
                            <option value={TezosContract.AssetType.VEHICLES}>Vehicles</option>
                            <option value={TezosContract.AssetType.COMMODITIES}>Commodities</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Token List */}
            {!isConnected ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Connect Wallet</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Please connect your Tezos wallet to view the marketplace
                    </p>
                </div>
            ) : totalCount === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Tokens Registered</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Tokens will appear here once they are registered in the token registry
                    </p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                            <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                                Marketplace requires indexer integration
                            </p>
                            <p style={{ fontSize: 'var(--font-size-xs)' }}>
                                In production, this would use TzKT API to query all tokens from the token_registry big_map.
                                The registry currently has {totalCount} token{totalCount !== 1 ? 's' : ''} registered.
                            </p>
                        </div>
                    </div>

                    {/* Pagination */}
                    {filteredTokens.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                Showing {startIndex + 1}-{Math.min(endIndex, filteredTokens.length)} of {filteredTokens.length}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Button
                                    variant="ghost"
                                    leftIcon={<ChevronLeft size={16} />}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    rightIcon={<ChevronRight size={16} />}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
