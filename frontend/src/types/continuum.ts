/**
 * Shared TypeScript interfaces for YieldStream EVM Protocol
 */

export interface TokenIndexEntry {
    tokenId: number; // ERC721 Token ID
    asset_type: number;
    stream_id: number;
    metadata_uri: string;
    registered_at: number;
}

// Note: These values are typically converted from raw BigNumberish (wei) to display numbers (e.g., APT, BUSD) in hooks/components.
export interface StreamInfo {
    sender: string;
    recipient: string;
    totalAmount: number; // In display units (e.g., BUSD)
    flowRate: number;    // In display units per second
    startTime: number;
    stopTime: number;
    amountWithdrawn: number; // In display units
    isActive: boolean;
}

export interface RentalDetails {
    tenant: string;
    landlord: string;
    timeRemaining: number;
    totalPaidSoFar: number;
    isActive: boolean;
}

export interface ComplianceStatus {
    isAdmin: boolean;
    hasKYC: boolean;
    canTradeRealEstate: boolean;
}

export interface ActiveRental {
    streamId: number;
    tokenId: number; // ERC721 Token ID
    tokenAddress: string; // The address of the TokenRegistry contract
    assetType: 'Real Estate' | 'Vehicle' | 'Heavy Machinery' | 'Unknown Asset'; // Updated to string literals
    title: string;
    pricePerHour: number; // In display units per hour
    startTime: number; 
    duration: number; // Total stream duration in seconds
    totalBudget: number; // In display units
    amountSpent: number; // In display units
    description: string; // Added description
    imageUrl?: string; // Added imageUrl
    streamInfo?: StreamInfo; // Added streamInfo
    metadataUri?: string; // Added metadataUri
    attributes?: Array<{ trait_type: string; value: string | number }>; // Added attributes
    location?: { lat: number; lng: number; city: string; }; // Added location
}

export interface AssetLocation {
    id: string; // ERC721 tokenId as string for unique key
    tokenId: number; // ERC721 Token ID as number
    assetType: 'Real Estate' | 'Vehicle' | 'Heavy Machinery' | 'Unknown Asset'; // Updated type strings
    title: string;
    tokenAddress: string; // The address of the TokenRegistry contract
    status: 'active' | 'frozen' | 'idle';
    location: {
        lat: number;
        lng: number;
        city: string;
    };
    streamId?: number;
    currentValue: number;
    yieldRate: number;
    totalEarned: number;
    lastUpdate: number;
    description: string; 
    imageUrl?: string; 
    streamInfo?: StreamInfo; 
    metadataUri?: string; 
    attributes?: Array<{ trait_type: string; value: string | number }>; 
}