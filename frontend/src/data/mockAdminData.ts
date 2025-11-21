/**
 * Mock data for Admin Dashboard
 * Real coordinates for San Francisco Bay Area
 */

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
    yieldRate: number; // APT per second
    totalEarned: number;
    lastUpdate: number;
}

export interface PendingKYCRequest {
    address: string;
    jurisdiction: string;
    riskScore: 'low' | 'medium' | 'high';
    requestedAt: number;
    verificationLevel: number;
}

export const mockAssets: AssetLocation[] = [
    // Cars - Moving around SF
    {
        id: 'CAR-001',
        type: 'car',
        name: 'Tesla Model 3 #42',
        tokenAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.7749, lng: -122.4194, city: 'San Francisco' },
        streamId: 1,
        currentValue: 45000,
        yieldRate: 0.005,
        totalEarned: 1250,
        lastUpdate: Date.now(),
    },
    {
        id: 'CAR-002',
        type: 'car',
        name: 'CyberTruck Fleet #01',
        tokenAddress: '0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.8044, lng: -122.2712, city: 'Oakland' },
        streamId: 2,
        currentValue: 60000,
        yieldRate: 0.008,
        totalEarned: 2100,
        lastUpdate: Date.now(),
    },
    {
        id: 'CAR-003',
        type: 'car',
        name: 'BMW i4 #23',
        tokenAddress: '0x3234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'frozen',
        location: { lat: 37.3688, lng: -122.0363, city: 'San Jose' },
        currentValue: 52000,
        yieldRate: 0.006,
        totalEarned: 890,
        lastUpdate: Date.now(),
    },
    {
        id: 'CAR-004',
        type: 'car',
        name: 'Audi e-tron #15',
        tokenAddress: '0x4234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.5485, lng: -121.9886, city: 'Fremont' },
        streamId: 4,
        currentValue: 48000,
        yieldRate: 0.0055,
        totalEarned: 1450,
        lastUpdate: Date.now(),
    },

    // Real Estate - Static locations
    {
        id: 'RE-001',
        type: 'real_estate',
        name: 'Aptos Tower Unit #501',
        tokenAddress: '0x5234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.7858, lng: -122.4064, city: 'San Francisco (Financial District)' },
        streamId: 5,
        currentValue: 850000,
        yieldRate: 0.012,
        totalEarned: 8500,
        lastUpdate: Date.now(),
    },
    {
        id: 'RE-002',
        type: 'real_estate',
        name: 'Marina Heights #203',
        tokenAddress: '0x6234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.8049, lng: -122.4372, city: 'San Francisco (Marina)' },
        streamId: 6,
        currentValue: 720000,
        yieldRate: 0.01,
        totalEarned: 7200,
        lastUpdate: Date.now(),
    },
    {
        id: 'RE-003',
        type: 'real_estate',
        name: 'Silicon Valley Office',
        tokenAddress: '0x7234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'idle',
        location: { lat: 37.3861, lng: -122.0839, city: 'Mountain View' },
        currentValue: 1200000,
        yieldRate: 0.015,
        totalEarned: 0,
        lastUpdate: Date.now(),
    },

    // Heavy Machinery
    {
        id: 'MACH-001',
        type: 'machinery',
        name: 'Caterpillar Excavator #X9',
        tokenAddress: '0x8234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.4419, lng: -122.1430, city: 'Palo Alto' },
        streamId: 8,
        currentValue: 125000,
        yieldRate: 0.009,
        totalEarned: 3200,
        lastUpdate: Date.now(),
    },
    {
        id: 'MACH-002',
        type: 'machinery',
        name: 'John Deere Tractor #T42',
        tokenAddress: '0x9234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'active',
        location: { lat: 37.9577, lng: -121.2908, city: 'Livermore' },
        streamId: 9,
        currentValue: 95000,
        yieldRate: 0.007,
        totalEarned: 2850,
        lastUpdate: Date.now(),
    },
];

export const pendingKYCRequests: PendingKYCRequest[] = [
    {
        address: '0xbob123456789abcdef123456789abcdef123456789abcdef123456789abcdef',
        jurisdiction: 'US',
        riskScore: 'low',
        requestedAt: Date.now() - 86400000, // 1 day ago
        verificationLevel: 1,
    },
    {
        address: '0xalice23456789abcdef123456789abcdef123456789abcdef123456789abcdef',
        jurisdiction: 'UK',
        riskScore: 'low',
        requestedAt: Date.now() - 172800000, // 2 days ago
        verificationLevel: 2,
    },
    {
        address: '0xcharlie3456789abcdef123456789abcdef123456789abcdef123456789abcdef',
        jurisdiction: 'SG',
        riskScore: 'medium',
        requestedAt: Date.now() - 43200000, // 12 hours ago
        verificationLevel: 1,
    },
];

export const globalStats = {
    activeStreams: 7,
    totalValueLocked: 3195000, // Sum of all active asset values
    totalYieldDistributed: 27440,
    iotUptime: 99.8,
    frozenAssets: 1,
};
