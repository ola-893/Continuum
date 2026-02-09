# Multi-Asset Stream Handling Implementation

## Overview

This document describes the implementation of multi-asset stream handling in the Continuum Protocol frontend. The implementation allows users to view and manage multiple assets with different yield streams, each updating independently in real-time.

## Task 14.5 Requirements

**Requirements: 10.10**

- Display multiple assets with different streams
- Update all balances independently
- Handle different token types

## Components

### 1. MultiAssetStreamDisplay Component

**Location:** `frontend/src/components/ui/MultiAssetStreamDisplay.tsx`

**Purpose:** A flexible component for displaying multiple assets with independent stream updates.

**Features:**
- **Grid Layout**: Compact card view for browsing multiple assets
- **List Layout**: Detailed view with expanded information
- **Independent Updates**: Each asset's balance updates every second independently
- **Token Type Support**: Handles different token types (USDT, APT, USDC) with appropriate decimals
- **Expandable Details**: Optional detailed stream information per asset
- **Responsive Design**: Adapts to different screen sizes

**Props:**
```typescript
interface MultiAssetStreamDisplayProps {
    assets: AssetStreamData[];      // Array of assets to display
    className?: string;              // Optional CSS classes
    layout?: 'grid' | 'list';       // Display layout
    showDetails?: boolean;           // Show detailed stream info
}
```

**Asset Data Format:**
```typescript
interface AssetStreamData {
    tokenAddress: string;            // Unique identifier
    assetType: string;               // Real Estate, Vehicle, Commodities
    title: string;                   // Asset name
    imageUrl?: string;               // Optional asset image
    streamInfo: StreamInfo;          // Stream parameters
    tokenSymbol?: string;            // Token symbol (USDT, APT, etc.)
    tokenDecimals?: number;          // Token decimal places
}
```

### 2. useMultiAssetStreams Hook

**Location:** `frontend/src/components/ui/MultiAssetStreamDisplay.tsx`

**Purpose:** Provides utilities for managing and filtering multiple asset streams.

**Features:**
- **Active Count**: Tracks number of active streams
- **Asset Type Filtering**: Filter by Real Estate, Vehicle, Commodities
- **Token Type Filtering**: Filter by token symbol
- **Active Filtering**: Show only active streams
- **Balance Sorting**: Sort assets by claimable balance

**Usage:**
```typescript
const {
    activeCount,
    filterByAssetType,
    filterByTokenType,
    filterActive,
    sortByBalance,
} = useMultiAssetStreams(assets);

// Filter by asset type
const realEstateAssets = filterByAssetType('Real Estate');

// Filter by token type
const usdtAssets = filterByTokenType('USDT');

// Get only active streams
const activeAssets = filterActive();

// Sort by balance (descending)
const sortedAssets = sortByBalance(true);
```

## Integration

### Portfolio Page

**Location:** `frontend/src/pages/Portfolio.tsx`

**Enhancements:**
- View mode toggle (Grid/List)
- Asset type filters (All, Real Estate, Vehicles, Commodities)
- Show/hide details toggle
- Active stream count display
- Uses MultiAssetStreamDisplay for rendering

**Key Features:**
```typescript
// View mode control
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

// Asset type filtering
const [filterAssetType, setFilterAssetType] = useState<string | null>(null);

// Detail visibility
const [showDetails, setShowDetails] = useState(false);

// Convert portfolio assets to stream format
const assetStreamData: AssetStreamData[] = assets.map((asset) => ({
    tokenAddress: asset.tokenAddress,
    assetType: asset.assetType,
    title: asset.title,
    imageUrl: asset.imageUrl,
    streamInfo: {
        startTime: asset.streamInfo.startTime,
        flowRate: asset.streamInfo.flowRate,
        amountWithdrawn: asset.streamInfo.amountWithdrawn,
        totalAmount: asset.streamInfo.totalAmount,
        stopTime: asset.streamInfo.stopTime,
        status: asset.streamInfo.isActive ? 0 : 2,
    },
    tokenSymbol: 'APT',
    tokenDecimals: 8,
}));
```

### Demo Page

**Location:** `frontend/src/pages/MultiAssetDemo.tsx`

**Purpose:** Demonstrates multi-asset stream capabilities with mock data.

**Features:**
- 6 mock assets with different token types
- Real-time balance updates
- Asset type filtering
- Layout switching
- Statistics dashboard
- Educational information

## Technical Implementation

### Independent Balance Updates

Each asset's balance is calculated independently using the `useStreamBalance` hook:

```typescript
// In MultiAssetStreamDisplay component
{assets.map((asset) => (
    <div key={asset.tokenAddress}>
        <LiveBalance
            streamInfo={asset.streamInfo}
            showRate={true}
            decimals={asset.tokenDecimals || 6}
        />
    </div>
))}
```

The `useStreamBalance` hook:
1. Calculates balance using: `(current_time - start_time) * flow_rate - amount_withdrawn`
2. Updates every second via `setInterval`
3. Stops updating after `stop_time`
4. Handles stream status (active, paused, cancelled)

### Token Type Handling

Different token types are handled through the `tokenDecimals` and `tokenSymbol` props:

```typescript
// USDT (6 decimals)
tokenSymbol: 'USDT',
tokenDecimals: 6,

// APT (8 decimals)
tokenSymbol: 'APT',
tokenDecimals: 8,

// USDC (6 decimals)
tokenSymbol: 'USDC',
tokenDecimals: 6,
```

The `mutezToTokens` utility function converts from smallest unit to display units:

```typescript
const displayAmount = mutezToTokens(rawAmount, tokenDecimals);
```

### Performance Considerations

1. **Efficient Re-renders**: Each asset card is memoized to prevent unnecessary re-renders
2. **Independent Intervals**: Each stream has its own interval timer
3. **Cleanup**: All intervals are properly cleaned up on unmount
4. **Lazy Loading**: Images are loaded on-demand
5. **Pagination**: Large asset lists can be paginated (future enhancement)

## Usage Examples

### Basic Grid Display

```typescript
import { MultiAssetStreamDisplay } from '../components/ui/MultiAssetStreamDisplay';

<MultiAssetStreamDisplay
    assets={assetStreamData}
    layout="grid"
    showDetails={false}
/>
```

### Detailed List View

```typescript
<MultiAssetStreamDisplay
    assets={assetStreamData}
    layout="list"
    showDetails={true}
/>
```

### With Filtering

```typescript
const { filterByAssetType } = useMultiAssetStreams(assets);
const filteredAssets = filterByAssetType('Real Estate');

<MultiAssetStreamDisplay
    assets={filteredAssets}
    layout="grid"
/>
```

### With Sorting

```typescript
const { sortByBalance } = useMultiAssetStreams(assets);
const sortedAssets = sortByBalance(true); // descending

<MultiAssetStreamDisplay
    assets={sortedAssets}
    layout="list"
    showDetails={true}
/>
```

## Testing

### Manual Testing Checklist

- [ ] Multiple assets display correctly in grid layout
- [ ] Multiple assets display correctly in list layout
- [ ] Each asset's balance updates independently every second
- [ ] Different token types (USDT, APT, USDC) display with correct decimals
- [ ] Asset type filtering works (Real Estate, Vehicle, Commodities)
- [ ] View mode toggle works (Grid/List)
- [ ] Show/hide details toggle works
- [ ] Stream status indicators display correctly (Active, Paused, Cancelled)
- [ ] Progress bars update in real-time
- [ ] Time remaining calculations are accurate
- [ ] Flow rates display correctly (per day/month)
- [ ] Escrow balance calculations are correct
- [ ] Component handles empty asset list gracefully
- [ ] Component handles single asset correctly
- [ ] Component handles 10+ assets without performance issues

### Browser Testing

Test in the following browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

1. **Pagination**: Add pagination for large asset lists (100+ assets)
2. **Virtual Scrolling**: Implement virtual scrolling for better performance
3. **Search**: Add search functionality to find specific assets
4. **Bulk Actions**: Allow claiming yield from multiple assets at once
5. **Export**: Export asset list to CSV/JSON
6. **Notifications**: Alert users when streams are about to end
7. **Analytics**: Show aggregate statistics across all assets
8. **Comparison**: Side-by-side comparison of multiple assets
9. **Favorites**: Allow users to mark favorite assets
10. **Custom Views**: Save custom filter/sort configurations

## Related Files

- `frontend/src/hooks/useStreamBalance.ts` - Balance calculation hook
- `frontend/src/components/ui/StreamDetails.tsx` - Detailed stream display
- `frontend/src/components/ui/LiveBalance.tsx` - Live balance component
- `frontend/src/services/tezosContractService.ts` - Contract interaction utilities
- `frontend/src/pages/Portfolio.tsx` - Portfolio page integration
- `frontend/src/pages/MultiAssetDemo.tsx` - Demo page

## Requirements Validation

✅ **Requirement 10.10: Display multiple assets with different streams**
- Implemented via MultiAssetStreamDisplay component
- Supports both grid and list layouts
- Each asset displays independently

✅ **Requirement 10.10: Update all balances independently**
- Each asset has its own useStreamBalance hook instance
- Independent setInterval timers per asset
- No shared state between assets

✅ **Requirement 10.10: Handle different token types**
- Supports configurable token symbols (USDT, APT, USDC, etc.)
- Supports configurable decimal places (6, 8, etc.)
- Proper formatting via mutezToTokens utility

## Conclusion

The multi-asset stream handling implementation provides a robust, performant, and user-friendly way to display and manage multiple yield-bearing assets. Each asset's balance updates independently in real-time, supporting different token types with appropriate formatting. The implementation is flexible, allowing for both compact grid views and detailed list views, with comprehensive filtering and sorting capabilities.
