# Checkpoint 16: Frontend Integration Testing Plan

## Overview
This document outlines the testing plan for Task 16: Ensure frontend integration works on Ghostnet.

## Current Status

### Contracts Deployment Status
- **Status**: ❌ NOT DEPLOYED
- **Location**: `tezos/config/ghostnet.json` shows empty contract addresses
- **Action Required**: Contracts must be deployed to Ghostnet before frontend testing

### Frontend Implementation Status
- **Wallet Integration**: ✅ Implemented (Task 12)
- **Contract Interaction**: ✅ Implemented (Task 13)
- **Real-time Balance Updates**: ✅ Implemented (Task 14)
- **Admin Dashboard**: ✅ Implemented (Task 15)
- **Network Configuration**: ✅ Implemented (Task 17 partial)

## Prerequisites for Testing

### 1. Deploy Contracts to Ghostnet
Before testing the frontend, contracts must be deployed:

```bash
cd tezos/scripts
python deploy_ghostnet.py --admin <your_admin_address>
```

After deployment, update `frontend/.env` with contract addresses.

### 2. Set Up Test Wallet
- Install Temple Wallet, Kukai, or Umami
- Get test XTZ from faucet: https://faucet.ghostnet.teztnets.xyz
- Minimum 10 XTZ recommended for testing

### 3. Prepare Test Data
- Admin address for KYC/whitelisting operations
- Test user addresses for compliance testing
- Sample asset metadata for minting

## Testing Checklist

### Test 1: Wallet Connection on Ghostnet ✓

**Objective**: Verify wallet connection works with Tezos wallets on Ghostnet

**Steps**:
1. Start frontend development server
2. Navigate to application
3. Click "Connect Wallet" button
4. Select wallet (Temple/Kukai/Umami)
5. Approve connection in wallet
6. Verify address and balance display
7. Test disconnect functionality
8. Test wallet switching
9. Refresh page and verify persistence

**Expected Results**:
- Wallet connects successfully
- User address displayed correctly
- XTZ balance shown
- Network indicator shows "Ghostnet"
- Connection persists across refresh
- Disconnect clears state

**Files to Check**:
- `frontend/src/hooks/useTezosWallet.ts`
- `frontend/src/components/ui/TezosWalletConnect.tsx`
- `frontend/src/services/tezosWalletService.ts`

---

### Test 2: Stream Creation End-to-End ✓

**Objective**: Verify complete stream creation flow from frontend to blockchain

**Prerequisites**:
- Wallet connected
- Admin has whitelisted user for asset type
- User has KYC approval

**Steps**:
1. Navigate to stream creation interface
2. Fill in stream parameters:
   - Recipient address
   - Token amount
   - Flow rate
   - Duration
   - Asset type
3. Review gas estimation
4. Submit transaction
5. Approve in wallet
6. Wait for confirmation
7. Verify stream appears in UI
8. Check stream details are correct

**Expected Results**:
- Form validation works
- Gas estimation displays
- Transaction submits successfully
- Confirmation received
- Stream ID generated
- Stream details match input
- Balance updates in real-time

**Files to Check**:
- `frontend/src/services/tezosContractService.ts`
- `frontend/src/services/transactionService.ts`
- `frontend/src/services/gasEstimationService.ts`
- `frontend/src/hooks/useContinuum.ts`

---

### Test 3: Yield Claiming ✓

**Objective**: Verify yield claiming functionality works correctly

**Prerequisites**:
- Active stream with claimable balance
- User is stream recipient
- Compliance checks pass

**Steps**:
1. Navigate to asset with active stream
2. Verify claimable balance displays and updates
3. Click "Claim Yield" button
4. Review transaction details
5. Approve in wallet
6. Wait for confirmation
7. Verify balance updated
8. Check amount_withdrawn increased
9. Verify tokens received in wallet

**Expected Results**:
- Claimable balance calculates correctly
- Balance updates every second
- Claim transaction succeeds
- UI resets claimable balance to zero
- Tokens transferred to wallet
- Transaction appears in block explorer

**Files to Check**:
- `frontend/src/hooks/useStreamBalance.ts`
- `frontend/src/components/ui/StreamDetails.tsx`
- `frontend/src/components/ui/ClaimYieldButton.tsx`
- `frontend/src/utils/streamCalculations.ts`

---

### Test 4: Admin Functions ✓

**Objective**: Verify admin dashboard functions work correctly

**Prerequisites**:
- Wallet connected with admin address
- Admin privileges in compliance guard

**Sub-tests**:

#### 4.1: Admin Authorization Check
- Navigate to admin dashboard
- Verify admin-only sections visible
- Test with non-admin address (should redirect/hide)

#### 4.2: Asset Minting
- Fill in asset details form
- Select asset type
- Enter yield parameters
- Submit minting transaction
- Verify NFT created
- Verify stream linked
- Verify token registry entry

#### 4.3: KYC Approval
- View pending KYC requests (if any)
- Select user address
- Choose asset types to whitelist
- Submit approval transaction
- Verify user whitelisted
- Test user can now create streams

#### 4.4: Emergency Freeze
- View list of active streams
- Select stream to freeze
- Enter freeze reason
- Submit freeze transaction
- Verify stream frozen
- Test that withdrawals fail
- Unfreeze stream
- Verify withdrawals work again

#### 4.5: Batch Whitelist
- Enter multiple user addresses
- Select asset types
- Submit batch transaction
- Verify all users whitelisted
- Test with one of the whitelisted users

#### 4.6: System Metrics
- View TVL display
- Check total assets count
- Check active streams count
- Verify metrics update after operations

**Expected Results**:
- Admin authorization works correctly
- All admin functions execute successfully
- Transactions confirm on blockchain
- UI updates reflect changes
- Non-admins cannot access admin functions

**Files to Check**:
- `frontend/src/hooks/useTezosAdmin.ts`
- `frontend/src/pages/admin/AssetFactory.tsx`
- `frontend/src/pages/admin/ComplianceDesk.tsx`
- `frontend/src/pages/admin/FleetControl.tsx`
- `frontend/src/pages/admin/GodView.tsx`
- `frontend/src/services/systemMetricsService.ts`

---

## Additional Tests

### Test 5: Multi-Asset Stream Handling
- Create multiple assets with different streams
- Verify all balances update independently
- Test claiming from multiple streams
- Verify correct token types

### Test 6: NFT Transfer with Yield Update
- Transfer NFT to another address
- Verify stream recipient updates automatically
- Test yield claim by new owner
- Verify old owner cannot claim

### Test 7: Flash Advance
- Navigate to asset with stream
- Request flash advance
- Verify immediate transfer
- Check future claims reduced
- Verify stream continues correctly

### Test 8: Error Handling
- Test with insufficient balance
- Test with invalid parameters
- Test network disconnection
- Test transaction rejection
- Verify error messages display correctly

### Test 9: Network Switching
- Switch wallet to Mainnet
- Verify warning displays
- Switch back to Ghostnet
- Verify contracts reload correctly

### Test 10: Real-time Updates
- Open asset in two browser tabs
- Claim yield in one tab
- Verify other tab updates
- Test with multiple simultaneous streams

---

## Known Issues / Blockers

### Critical Blockers
1. **Contracts Not Deployed**: Cannot test without deployed contracts
   - **Resolution**: Deploy contracts to Ghostnet first
   - **Command**: `cd tezos/scripts && python deploy_ghostnet.py`

2. **Contract Addresses Not Configured**: Frontend .env file empty
   - **Resolution**: Update `.env` after deployment
   - **File**: `frontend/.env`

### Non-Critical Issues
- None identified yet (will update during testing)

---

## Testing Environment

### Required Tools
- Node.js 18+ and npm
- Modern browser (Chrome/Firefox/Brave)
- Tezos wallet extension
- Internet connection

### Environment Variables
Update `frontend/.env` with deployed contract addresses:
```env
VITE_TEZOS_NETWORK=ghostnet
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_GHOSTNET_COMPLIANCE_GUARD=KT1...
VITE_GHOSTNET_TOKEN_REGISTRY=KT1...
VITE_GHOSTNET_RWA_HUB=KT1...
VITE_GHOSTNET_FA2_TOKEN=KT1...
```

### Start Development Server
```bash
cd frontend
npm install
npm run dev
```

---

## Success Criteria

All tests must pass with the following criteria:
- ✅ Wallet connects successfully to Ghostnet
- ✅ Stream creation completes end-to-end
- ✅ Yield claiming works correctly
- ✅ Admin functions execute successfully
- ✅ Real-time balance updates work
- ✅ Error handling is appropriate
- ✅ Network configuration is correct
- ✅ UI updates reflect blockchain state

---

## Next Steps After Testing

1. Document any issues found
2. Fix critical bugs
3. Update user documentation
4. Prepare for Task 17 (Network configuration management)
5. Plan for data migration (Task 18)

---

## Notes

- Testing should be done with small amounts first
- Keep transaction hashes for reference
- Monitor gas costs during testing
- Take screenshots of successful operations
- Document any unexpected behavior

