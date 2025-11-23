/**
 * Shared TypeScript interfaces for Continuum Protocol
 */

export interface TokenIndexEntry {
    token_address: string;
    asset_type: number;
    stream_id: number;
    metadata_uri: string;
    registered_at: number;
    // Optional fields often added by frontend logic
    name?: string;
    description?: string;
    uri?: string;
}

export interface StreamInfo {
    sender: string;
    recipient: string;
    totalAmount: number;
    flowRate: number;
    startTime: number;
    stopTime: number;
    amountWithdrawn: number;
    status: number;
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
    tokenAddress: string;
    assetType: number;
    title: string;
    pricePerHour: number;
    startTime: number;
    duration: number;
    totalBudget: number;
    amountSpent: number;
}

export interface AssetLocation {
    id: string;
    type: 'car' | 'real_estate' | 'machinery';
    name: string;
    tokenAddress: string;
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
}
