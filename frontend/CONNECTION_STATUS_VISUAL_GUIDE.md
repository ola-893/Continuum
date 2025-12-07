# Connection Status Visual Guide

## Component Appearance

### Connected State
```
┌─────────────────────────────────┐
│  🟢 Connected                   │
└─────────────────────────────────┘
```
- Green Wifi icon
- "Connected" text
- Green border

### Disconnected State
```
┌─────────────────────────────────┬──────┐
│  🔴 Disconnected                │  🔄  │
└─────────────────────────────────┴──────┘
```
- Red WifiOff icon
- "Disconnected" text
- Red border
- Reconnect button (blue)

### Checking State
```
┌─────────────────────────────────┐
│  🟡 Checking...                 │
└─────────────────────────────────┘
```
- Yellow spinning RefreshCw icon
- "Checking..." text
- Yellow border

## Tooltip (Hover State)

When hovering over the status indicator:

```
┌─────────────────────────────────┐
│  🟢 Connected                   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Service Status                  │
├─────────────────────────────────┤
│ Backend (Node.js)               │
│                  connected  ✓   │
├─────────────────────────────────┤
│ Python Service                  │
│                  connected  ✓   │
├─────────────────────────────────┤
│ Memory Hub                      │
│                  connected  ✓   │
├─────────────────────────────────┤
│ Last checked: 10:30:45 AM       │
└─────────────────────────────────┘
```

## Compact Mode

```
┌────┐
│ 🟢 │
└────┘
```
- Just the icon
- No text
- Smaller size

## In Navbar Context

```
┌────────────────────────────────────────────────────────────────┐
│  ∞ YieldStream    Dashboard  Rentals  Launch Agent  AI Matcher │
│                                                                  │
│                                    🟢 Connected  [Connect Wallet]│
└────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Connected (Green)
- Icon: `rgb(34, 197, 94)`
- Border: `rgb(34, 197, 94)`
- Background: `rgba(34, 197, 94, 0.1)`

### Disconnected (Red)
- Icon: `rgb(239, 68, 68)`
- Border: `rgb(239, 68, 68)`
- Background: `rgba(239, 68, 68, 0.1)`

### Checking (Yellow)
- Icon: `rgb(251, 191, 36)`
- Border: `rgb(251, 191, 36)`
- Background: `rgba(251, 191, 36, 0.1)`

### Reconnect Button (Blue)
- Icon: `rgb(59, 130, 246)`
- Border: `rgba(59, 130, 246, 0.3)`
- Background: `rgba(59, 130, 246, 0.1)`
- Hover: `rgba(59, 130, 246, 0.2)`

## Animations

### Spin Animation (Checking State)
```
🔄 → ↻ → ↺ → 🔄
```
Continuous 1-second rotation

### Fade In (Tooltip)
```
Opacity: 0 → 1
Transform: translateY(-4px) → translateY(0)
Duration: 0.2s
```

### Hover Transitions
```
Background: 0.2s ease
All properties: 0.2s
```

## Responsive Behavior

### Desktop (> 768px)
- Full mode with text
- Tooltip on hover
- Reconnect button visible

### Tablet (768px - 1024px)
- Full mode with text
- Tooltip on hover
- Reconnect button visible

### Mobile (< 768px)
- Consider using compact mode
- Tooltip may be disabled
- Tap to show details

## Accessibility

### Keyboard Navigation
- Tab to focus on reconnect button
- Enter/Space to trigger reconnect

### Screen Readers
- Status announced as "Connected", "Disconnected", or "Checking"
- Service names read in tooltip
- Reconnect button labeled "Reconnect to services"

### Color Contrast
- All text meets WCAG AA standards
- Icons have sufficient contrast
- Status indicated by both color and icon

## Usage in Different Contexts

### Navbar (Primary)
```tsx
<Navbar>
    <ConnectionStatus />
</Navbar>
```

### Dashboard Widget
```tsx
<DashboardWidget>
    <ConnectionStatus compact={true} />
</DashboardWidget>
```

### Settings Page
```tsx
<SettingsSection>
    <ConnectionStatus 
        checkInterval={10000}
        showTooltip={true}
    />
</SettingsSection>
```

### Mobile Header
```tsx
<MobileHeader>
    <ConnectionStatus 
        compact={true}
        showTooltip={false}
    />
</MobileHeader>
```

## State Transitions

```
Initial Load
    ↓
Checking (yellow, spinning)
    ↓
    ├─→ Connected (green, static)
    │       ↓
    │   (30s interval)
    │       ↓
    │   Checking (yellow, spinning)
    │       ↓
    │   Connected (green, static)
    │
    └─→ Disconnected (red, static)
            ↓
        [User clicks reconnect]
            ↓
        Checking (yellow, spinning)
            ↓
            ├─→ Connected (green, static)
            └─→ Disconnected (red, static)
```

## Error States

### Backend Unreachable
```
┌─────────────────────────────────┬──────┐
│  🔴 Disconnected                │  🔄  │
└─────────────────────────────────┴──────┘

Tooltip shows:
- Backend (Node.js): disconnected ✗
- Python Service: disconnected ✗
- Memory Hub: disconnected ✗
```

### Python Service Down
```
┌─────────────────────────────────┬──────┐
│  🔴 Disconnected                │  🔄  │
└─────────────────────────────────┴──────┘

Tooltip shows:
- Backend (Node.js): connected ✓
- Python Service: disconnected ✗
- Memory Hub: disconnected ✗
```

### Memory Hub Disconnected
```
┌─────────────────────────────────┬──────┐
│  🔴 Disconnected                │  🔄  │
└─────────────────────────────────┴──────┘

Tooltip shows:
- Backend (Node.js): connected ✓
- Python Service: connected ✓
- Memory Hub: disconnected ✗
```

## Best Practices

### Placement
- ✅ Top-right corner of navbar (primary)
- ✅ Dashboard widgets (secondary)
- ✅ Settings pages (tertiary)
- ❌ Avoid placing in content areas
- ❌ Don't duplicate on same page

### Configuration
- ✅ Use default 30s interval for production
- ✅ Use compact mode on mobile
- ✅ Enable tooltip for desktop
- ❌ Don't set interval < 5s (too frequent)
- ❌ Don't disable tooltip on desktop

### User Experience
- ✅ Show reconnect button when disconnected
- ✅ Provide clear status messages
- ✅ Use consistent colors across app
- ❌ Don't hide status when disconnected
- ❌ Don't auto-reconnect without user action

## Integration Checklist

- [x] Component created
- [x] Added to Navbar
- [x] Styled consistently
- [x] Tooltip implemented
- [x] Reconnect button working
- [x] Health checks functional
- [x] TypeScript types defined
- [x] Documentation complete
- [x] Build successful
- [x] No diagnostics errors

