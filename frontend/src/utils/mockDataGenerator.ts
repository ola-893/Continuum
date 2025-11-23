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
// VEHICLE MOCK DATA
// ============================================

const VEHICLE_BRANDS = [
    'Tesla',
    'Mercedes-Benz',
    'BMW',
    'Audi',
    'Porsche',
    'Lexus',
    'Range Rover',
    'Lamborghini',
    'Ferrari',
    'Bentley',
];

const VEHICLE_MODELS = [
    'Model S Plaid',
    'S-Class',
    'i8 Hybrid',
    'e-tron GT',
    '911 Turbo',
    'LC 500',
    'Sport SVR',
    'Huracán EVO',
    'F8 Tributo',
    'Continental GT',
];

const VEHICLE_IMAGES = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', // Luxury sports car
    'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800', // Tesla
    'https://images.unsplash.com/photo-1617531653520-bd4f01fc7ba1?w=800', // BMW
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', // Sports car
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', // Luxury sedan
];

const VEHICLE_COLORS = [
    'Midnight Black',
    'Pearl White',
    'Racing Red',
    'Ocean Blue',
    'Silver Metallic',
    'Emerald Green',
    'Sunset Orange',
    'Storm Gray',
];

// ============================================
// COMMODITIES/EQUIPMENT MOCK DATA
// ============================================

const EQUIPMENT_TYPES = [
    'Excavator',
    'Bulldozer',
    'Tower Crane',
    'Forklift',
    'Backhoe Loader',
    'Concrete Mixer',
    'Dump Truck',
    'Road Roller',
    'Scissor Lift',
    'Generator',
];

const EQUIPMENT_BRANDS = [
    'Caterpillar',
    'John Deere',
    'Komatsu',
    'Volvo',
    'Hitachi',
    'JCB',
    'Liebherr',
    'Bobcat',
];

const EQUIPMENT_IMAGES = [
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800', // Construction equipment
    'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800', // Heavy machinery
    'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800', // Excavator
    'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800', // Industrial equipment
];

const EQUIPMENT_MODELS = [
    'HD Series',
    'Pro Edition',
    'Industrial XL',
    'Heavy Duty 3000',
    'Commercial Grade',
    'Elite Series',
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
 * Generate mock data for Vehicles
 */
function generateVehicleMock(address: string, context: 'rental' | 'portfolio' | 'marketplace'): MockAssetData {
    const brandIndex = getSeededValue(address, VEHICLE_BRANDS.length);
    const modelIndex = getSeededValue(address, VEHICLE_MODELS.length, 1);
    const colorIndex = getSeededValue(address, VEHICLE_COLORS.length, 2);
    const imageIndex = getSeededValue(address, VEHICLE_IMAGES.length, 3);
    const year = 2021 + getSeededValue(address, 3, 4); // 2021-2023

    const name = `${year} ${VEHICLE_BRANDS[brandIndex]} ${VEHICLE_MODELS[modelIndex]}`;
    const color = VEHICLE_COLORS[colorIndex];

    let description = '';
    if (context === 'rental') {
        description = `Experience luxury driving in this ${color} ${VEHICLE_BRANDS[brandIndex]}. Premium interior, latest tech, perfect for business or pleasure.`;
    } else if (context === 'portfolio') {
        description = `${color} ${year} model. High-demand luxury vehicle with excellent rental history and appreciation potential.`;
    } else {
        description = `${year} • ${color} • Premium features & autonomous driving capability`;
    }

    return {
        name,
        description,
        image: VEHICLE_IMAGES[imageIndex],
        additionalInfo: `${year} • ${color}`,
    };
}

/**
 * Generate mock data for Equipment/Commodities
 */
function generateEquipmentMock(address: string, context: 'rental' | 'portfolio' | 'marketplace'): MockAssetData {
    const typeIndex = getSeededValue(address, EQUIPMENT_TYPES.length);
    const brandIndex = getSeededValue(address, EQUIPMENT_BRANDS.length, 1);
    const modelIndex = getSeededValue(address, EQUIPMENT_MODELS.length, 2);
    const imageIndex = getSeededValue(address, EQUIPMENT_IMAGES.length, 3);
    const year = 2020 + getSeededValue(address, 4, 4); // 2020-2023

    const name = `${EQUIPMENT_BRANDS[brandIndex]} ${EQUIPMENT_TYPES[typeIndex]} ${EQUIPMENT_MODELS[modelIndex]}`;

    let description = '';
    if (context === 'rental') {
        description = `Heavy-duty ${EQUIPMENT_TYPES[typeIndex]} ready for your construction project. ${year} model, well-maintained, operator available.`;
    } else if (context === 'portfolio') {
        description = `Industrial-grade ${EQUIPMENT_TYPES[typeIndex]} with consistent rental demand. ${year} model in excellent condition.`;
    } else {
        description = `${year} ${EQUIPMENT_BRANDS[brandIndex]} • Heavy-duty ${EQUIPMENT_TYPES[typeIndex]} • Professional grade`;
    }

    return {
        name,
        description,
        image: EQUIPMENT_IMAGES[imageIndex],
        additionalInfo: `${year} ${EQUIPMENT_BRANDS[brandIndex]}`,
    };
}

/**
 * Main generator function - generates contextually appropriate mock data
 */
export function generateMockAssetData(
    assetType: number | undefined,
    tokenAddress: string,
    context: 'rental' | 'portfolio' | 'marketplace' = 'marketplace'
): MockAssetData {
    // Default to generic if type is undefined
    if (assetType === undefined) {
        const suffix = tokenAddress.slice(-4);
        return {
            name: `Asset #${suffix}`,
            description: 'Tokenized real-world asset with yield potential',
            image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
        };
    }

    switch (assetType) {
        case 0: // Real Estate
            return generateRealEstateMock(tokenAddress, context);
        case 1: // Vehicle
            return generateVehicleMock(tokenAddress, context);
        case 2: // Commodities/Equipment
            return generateEquipmentMock(tokenAddress, context);
        default:
            const suffix = tokenAddress.slice(-4);
            return {
                name: `Asset #${suffix}`,
                description: 'Tokenized real-world asset',
                image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
            };
    }
}

/**
 * Get just the image for an asset type (for components that only need the image)
 */
export function getMockImage(assetType: number | undefined, tokenAddress: string): string {
    if (assetType === undefined) {
        return 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800';
    }

    const imageIndex = getSeededValue(tokenAddress, 5, assetType);

    switch (assetType) {
        case 0:
            return REAL_ESTATE_IMAGES[imageIndex % REAL_ESTATE_IMAGES.length];
        case 1:
            return VEHICLE_IMAGES[imageIndex % VEHICLE_IMAGES.length];
        case 2:
            return EQUIPMENT_IMAGES[imageIndex % EQUIPMENT_IMAGES.length];
        default:
            return 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800';
    }
}
