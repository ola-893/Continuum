/**
 * Mock data for demo purposes - Bob's portfolio
 */

export const mockAssets = [
    {
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        assetType: 'Real Estate',
        title: 'Aptos Tower Unit #501',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        metadata: {
            location: 'Downtown Aptos City',
            squareFeet: '1,250 sq ft',
            tenant: 'TechCorp Inc.',
        },
        streamInfo: {
            startTime: Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60), // Started 15 days ago
            flowRate: 0.0034, // $0.0034 per second
            amountWithdrawn: 0,
            totalAmount: 2000,
            stopTime: Math.floor(Date.now() / 1000) + (15 * 24 * 60 * 60), // Ends in 15 days
            isActive: true,
        },
    },
    {
        tokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        assetType: 'Real Estate',
        title: 'Beachside Villa #203',
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        metadata: {
            location: 'Coastal District',
            squareFeet: '2,500 sq ft',
            tenant: 'Private Resident',
        },
        streamInfo: {
            startTime: Math.floor(Date.now() / 1000) - (20 * 24 * 60 * 60),
            flowRate: 0.0058,
            amountWithdrawn: 500,
            totalAmount: 3500,
            stopTime: Math.floor(Date.now() / 1000) + (10 * 24 * 60 * 60),
            isActive: true,
        },
    },
    {
        tokenAddress: '0x9876543210fedcba9876543210fedcba98765432',
        assetType: 'Securities',
        title: 'Corporate Bond #A451',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
        metadata: {
            issuer: 'Aptos Corp',
            maturity: '2026-12-31',
            couponRate: '5.5%',
        },
        streamInfo: {
            startTime: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60),
            flowRate: 0.0023,
            amountWithdrawn: 0,
            totalAmount: 1500,
            stopTime: Math.floor(Date.now() / 1000) + (20 * 24 * 60 * 60),
            isActive: false, // Repaying advance
        },
    },
];

// Bob's selected asset for detail view
export const getAssetByAddress = (address: string) => {
    return mockAssets.find((asset) => asset.tokenAddress === address);
};
