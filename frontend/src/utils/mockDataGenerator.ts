/**
 * Smart Mock Data Generator
 * Generates contextually appropriate, deterministic mock data for assets
 * when NFT metadata is unavailable.
 */

// Hash function for deterministic randomness based on address
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Get deterministic "random" number from address
function getSeededValue(address: string, max: number, offset: number = 0): number {
    return (hashCode(address + offset) % max);
}

// ============================================
// REAL ESTATE MOCK DATA
// ============================================

const REAL_ESTATE_NAMES = [
    'Skyline Tower',
    'Harbor View Residences',
    'Metropolitan Plaza',
    'Riverside Apartments',
    'Central Park Suites',
    'Ocean Breeze Complex',
    'Downtown Lofts',
    'Garden District Manor',
    'Hilltop Estates',
    'Lakeside Condominiums',
    'Innovation Hub Office',
    'Tech Campus Building',
    'Financial District Tower',
    'Luxury Penthouses',
    'Urban Living Complex',
];

const REAL_ESTATE_IMAGES = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', // Modern glass building
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', // Luxury apartment
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', // High-rise residential
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', // Modern home
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', // Luxury house
];

const REAL_ESTATE_LOCATIONS = [
    'Downtown Manhattan',
    'San Francisco Bay Area',
    'Miami Beach',
    'Los Angeles Hills',
    'Chicago Loop',
    'Boston Waterfront',
    'Seattle Tech District',
    'Austin Downtown',
    'Denver Highlands',
    'Portland Pearl District',
];



// ============================================
// GENERATOR FUNCTIONS
// ============================================

export interface MockAssetData {
    name: string;
    description: string;
    image: string;
    additionalInfo?: string;
}

/**
 * Generate mock data for Real Estate
 */
function generateRealEstateMock(address: string, context: 'rental' | 'portfolio' | 'marketplace'): MockAssetData {
    const nameIndex = getSeededValue(address, REAL_ESTATE_NAMES.length);
    const locationIndex = getSeededValue(address, REAL_ESTATE_LOCATIONS.length, 1);
    const imageIndex = getSeededValue(address, REAL_ESTATE_IMAGES.length, 2);
    const sqft = 800 + getSeededValue(address, 2200, 3); // 800-3000 sqft
    const bedrooms = 1 + getSeededValue(address, 4, 4); // 1-4 bedrooms

    const name = `${REAL_ESTATE_NAMES[nameIndex]} - ${REAL_ESTATE_LOCATIONS[locationIndex]}`;

    let description = '';
    if (context === 'rental') {
        description = `Live in luxury with ${bedrooms} bed, ${sqft} sqft. Premium amenities, 24/7 concierge, gym & pool access.`;
    } else if (context === 'portfolio') {
        description = `Prime ${bedrooms}-bedroom property in ${REAL_ESTATE_LOCATIONS[locationIndex]}. Strong rental demand, excellent location.`;
    } else {
        description = `${bedrooms} bed • ${sqft} sqft • Premium location with high occupancy rates`;
    }

    return {
        name,
        description,
        image: REAL_ESTATE_IMAGES[imageIndex],
        additionalInfo: `${sqft} sq ft • ${bedrooms} bed`,
    };
}



/**
 * Main generator function - generates contextually appropriate mock data
 */
export function generateMockAssetData(
    tokenAddress: string,
    context: 'rental' | 'portfolio' | 'marketplace' = 'marketplace'
): MockAssetData {
    return generateRealEstateMock(tokenAddress, context);
}

/**
 * Get just the image for an asset type (for components that only need the image)
 */
export function getMockImage(tokenAddress: string): string {
    const imageIndex = getSeededValue(tokenAddress, 5);
    return REAL_ESTATE_IMAGES[imageIndex % REAL_ESTATE_IMAGES.length];
}
