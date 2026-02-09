# Checkpoint 21: Action Plan to Complete Migration

**Date**: February 8, 2026  
**Status**: Action Plan for Remaining Work

## Overview

This document outlines the specific actions needed to complete the Continuum Protocol migration and achieve full feature parity with production readiness.

---

## Phase 1: Critical Fixes (Immediate - 1-2 days)

### 1.1 Fix Frontend Build Errors

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 4-6 hours

#### Actions:
1. **Remove Legacy Aptos Imports** (5 files)
   ```
   - frontend/src/pages/Rentals.tsx
   - frontend/src/services/aptosClient.ts
   - frontend/src/services/aptosService.ts
   - frontend/src/services/continuumService.ts
   - frontend/src/services/nftMintingService.ts
   ```
   - Delete or refactor these files to use Tezos equivalents
   - Update imports in dependent files

2. **Fix Type Mismatches** (Portfolio.tsx)
   - Add `sender` and `recipient` fields to StreamInfo type
   - Update mock data to include these fields

3. **Fix Transaction Service Types**
   - Add null checks for `confirmations` field
   - Use optional chaining or default values

4. **Clean Up Unused Variables**
   - Remove or use declared variables
   - Run ESLint to identify all issues

#### Verification:
```bash
cd frontend
npm run build
# Should complete with 0 errors
```

---

### 1.2 Fix Contract Test Infrastructure

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 3-4 hours

#### Actions:
1. **Fix Compliance Guard Tests**
   - Update test scenarios to properly set sender context
   - Use `scenario.set_sender()` before contract calls
   - Ensure admin is set as sender for admin operations

2. **Fix FA2 Token Tests**
   - Set sender context for transfer operations
   - Ensure proper owner/operator setup in test scenarios

3. **Fix RWA Hub Tests**
   - Resolve type inference issues
   - Explicitly type complex parameters
   - Simplify test scenarios if needed

#### Verification:
```bash
cd tezos
bash run_all_tests.sh
# Should show 6/6 tests passing
```

---

## Phase 2: Ghostnet Deployment & E2E Testing (2-3 days)

### 2.1 Deploy Contracts to Ghostnet

**Priority**: 🟡 HIGH  
**Estimated Time**: 2-3 hours

#### Actions:
1. **Prepare Deployment**
   - Ensure Ghostnet account has sufficient XTZ
   - Review deployment script parameters
   - Backup any existing deployments

2. **Execute Deployment**
   ```bash
   cd tezos/scripts
   python3 deploy_ghostnet.py
   ```

3. **Verify Deployment**
   ```bash
   python3 verify_deployment.py
   ```

4. **Save Contract Addresses**
   - Document all deployed contract addresses
   - Update frontend configuration

#### Deliverables:
- `deployed_contracts_ghostnet.json` with all addresses
- Verification report confirming successful deployment

---

### 2.2 Configure Frontend for Ghostnet

**Priority**: 🟡 HIGH  
**Estimated Time**: 1-2 hours

#### Actions:
1. **Update Contract Addresses**
   - Edit `frontend/src/config/contracts.ts`
   - Add Ghostnet contract addresses from deployment

2. **Update Network Configuration**
   - Verify `frontend/src/config/tezos.ts` has correct Ghostnet RPC
   - Test network switching

3. **Deploy Frontend to Test Environment**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

---

### 2.3 Execute End-to-End Testing

**Priority**: 🟡 HIGH  
**Estimated Time**: 4-6 hours

#### Test Scenarios:

1. **Wallet Connection Flow**
   - [ ] Connect Temple Wallet
   - [ ] Connect Kukai Wallet
   - [ ] Verify address display
   - [ ] Verify balance display
   - [ ] Test disconnect

2. **Stream Creation Flow**
   - [ ] Create basic stream
   - [ ] Verify tokens locked in escrow
   - [ ] Verify stream appears in UI
   - [ ] Check real-time balance updates

3. **Yield Claiming Flow**
   - [ ] Wait for claimable balance > 0
   - [ ] Click claim yield
   - [ ] Verify transaction submission
   - [ ] Verify balance updated after confirmation
   - [ ] Verify amount_withdrawn increased

4. **Flash Advance Flow**
   - [ ] Request flash advance
   - [ ] Verify immediate transfer
   - [ ] Verify future claims reduced
   - [ ] Verify stream continues correctly

5. **NFT Transfer Flow**
   - [ ] Transfer NFT to new owner
   - [ ] Verify stream recipient updated automatically
   - [ ] Verify new owner can claim yield
   - [ ] Verify old owner cannot claim

6. **Rental Stream Flow**
   - [ ] Create rental stream
   - [ ] Verify payment flow
   - [ ] Check access status
   - [ ] Transfer NFT and verify access revoked

7. **Admin Flows**
   - [ ] Register identity (KYC)
   - [ ] Whitelist user for asset type
   - [ ] Mint new RWA NFT
   - [ ] Freeze stream
   - [ ] Unfreeze stream
   - [ ] Batch whitelist multiple users

#### Deliverables:
- E2E test report with screenshots
- List of any issues discovered
- Gas cost measurements for all operations

---

## Phase 3: Optional Enhancements (3-5 days)

### 3.1 Implement Optional Property-Based Tests

**Priority**: 🟢 LOW  
**Estimated Time**: 8-12 hours

#### Tests to Implement (12 optional PBT tests):
- Property 2.3, 2.5, 2.7, 2.9, 2.11, 2.12, 2.13, 2.14 (Streaming)
- Property 3.3, 3.5, 3.7, 3.9, 3.10, 3.11 (Asset Yield)
- Property 5.4, 5.5, 5.8, 5.10, 5.11, 5.12 (Compliance)
- Property 6.3, 6.5, 6.7, 6.9, 6.10, 6.11 (Token Registry)
- Property 8.3, 8.5, 8.8, 8.9 (FA2)
- Property 9.3, 9.6, 9.9, 9.12, 9.14, 9.15 (RWA Hub)
- Property 11.8 (Admin)
- Property 13.5 (Contract Interaction)
- Property 14.2, 14.6 (Balance Updates)
- Property 17.5, 18.3, 18.6 (Migration)
- Property 19.2, 19.4, 19.5, 19.8 (Security)
- Property 20.2, 20.6 (Analytics)
- Property 23.1, 23.4 (Feature Parity)

**Note**: These are marked optional in the task list and can be implemented for additional confidence but are not blockers.

---

### 3.2 Configure Frontend Test Suite

**Priority**: 🟢 LOW  
**Estimated Time**: 6-8 hours

#### Actions:
1. **Install Testing Dependencies**
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
   ```

2. **Create Test Configuration**
   - Add `vitest.config.ts`
   - Configure test environment

3. **Write Core Tests**
   - Wallet connection tests
   - Balance calculation tests
   - Component rendering tests

4. **Add Test Script**
   ```json
   "scripts": {
     "test": "vitest --run",
     "test:watch": "vitest"
   }
   ```

---

### 3.3 Complete Documentation

**Priority**: 🟢 MEDIUM  
**Estimated Time**: 4-6 hours

#### Documents to Create:
1. **API Reference** (`docs/API_REFERENCE.md`)
   - All contract entrypoints
   - Parameter types and descriptions
   - Return values
   - Code examples

2. **User Guide** (`docs/USER_GUIDE.md`)
   - How to connect wallet
   - How to create streams
   - How to claim yield
   - How to use flash advance
   - How to transfer assets

3. **Troubleshooting Guide** (`docs/TROUBLESHOOTING.md`)
   - Common errors and solutions
   - Wallet connection issues
   - Transaction failures
   - Network issues

4. **Gas Cost Analysis** (`docs/GAS_COSTS.md`)
   - Typical gas costs for all operations
   - Comparison with Aptos
   - Optimization recommendations

---

## Phase 4: Pre-Mainnet Preparation (5-7 days)

### 4.1 Security Audit

**Priority**: 🔴 CRITICAL (Before Mainnet)  
**Estimated Time**: External dependency (1-2 weeks)

#### Actions:
1. **Engage Security Auditor**
   - Research reputable Tezos auditors
   - Provide contract code and documentation
   - Schedule audit timeline

2. **Internal Security Review**
   - Review all access control mechanisms
   - Verify escrow handling
   - Check for common vulnerabilities
   - Test emergency pause functionality

3. **Address Audit Findings**
   - Fix any critical issues
   - Document all changes
   - Re-test after fixes

---

### 4.2 Load Testing

**Priority**: 🟡 HIGH  
**Estimated Time**: 2-3 days

#### Actions:
1. **Create Load Test Scripts**
   - Simulate high transaction volume
   - Test concurrent users
   - Measure performance under load

2. **Execute Load Tests on Ghostnet**
   - Run tests with increasing load
   - Monitor gas costs
   - Identify bottlenecks

3. **Optimize Based on Results**
   - Address any performance issues
   - Optimize gas-heavy operations
   - Re-test after optimizations

---

### 4.3 Gas Optimization

**Priority**: 🟡 MEDIUM  
**Estimated Time**: 2-3 days

#### Actions:
1. **Analyze Current Gas Costs**
   - Measure all operations
   - Compare with targets
   - Identify optimization opportunities

2. **Implement Optimizations**
   - Minimize storage operations
   - Optimize big_map access patterns
   - Batch operations where possible

3. **Verify Optimizations**
   - Re-measure gas costs
   - Ensure functionality unchanged
   - Document improvements

---

## Phase 5: Mainnet Deployment (3-5 days)

### 5.1 Prepare Mainnet Deployment

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 1-2 days

#### Actions:
1. **Final Code Review**
   - Review all contract code
   - Verify all tests passing
   - Check documentation complete

2. **Prepare Deployment Script**
   - Update for Mainnet parameters
   - Add additional safety checks
   - Test on Ghostnet one final time

3. **Prepare Rollback Plan**
   - Document rollback procedures
   - Prepare emergency contacts
   - Set up monitoring alerts

---

### 5.2 Execute Mainnet Deployment

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 4-6 hours

#### Actions:
1. **Deploy Contracts**
   ```bash
   python3 deploy_mainnet.py
   ```

2. **Verify Deployment**
   ```bash
   python3 verify_deployment.py --network mainnet
   ```

3. **Test Basic Operations**
   - Create test stream
   - Verify all functions work
   - Check gas costs on Mainnet

---

### 5.3 Execute Data Migration

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 6-8 hours

#### Actions:
1. **Export Aptos Data**
   ```bash
   python3 export_aptos_data.py
   ```

2. **Import to Tezos Mainnet**
   ```bash
   python3 import_tezos_data.py --network mainnet
   ```

3. **Verify Migration**
   ```bash
   python3 verify_migration.py
   ```

4. **Generate Reconciliation Report**
   - Compare Aptos and Tezos state
   - Document any discrepancies
   - Resolve issues

---

### 5.4 Deploy Frontend to Production

**Priority**: 🔴 CRITICAL  
**Estimated Time**: 2-3 hours

#### Actions:
1. **Update Configuration**
   - Point to Mainnet contracts
   - Update network settings
   - Verify all environment variables

2. **Build Production Bundle**
   ```bash
   npm run build:production
   ```

3. **Deploy to Hosting**
   - Deploy to production hosting
   - Configure DNS
   - Enable HTTPS

4. **Verify Production Deployment**
   - Test all user flows
   - Verify contract interactions
   - Check analytics tracking

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Frontend builds with 0 errors
- ✅ All 6 contract tests pass
- ✅ No critical blockers remain

### Phase 2 Complete When:
- ✅ Contracts deployed to Ghostnet
- ✅ Frontend connected to Ghostnet
- ✅ All 7 E2E test scenarios pass

### Phase 3 Complete When:
- ✅ Optional PBT tests implemented (if desired)
- ✅ Frontend test suite configured (if desired)
- ✅ Documentation complete

### Phase 4 Complete When:
- ✅ Security audit passed
- ✅ Load testing completed
- ✅ Gas costs optimized

### Phase 5 Complete When:
- ✅ Contracts deployed to Mainnet
- ✅ Data migration successful
- ✅ Frontend live on production
- ✅ All user flows verified on Mainnet

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Critical Fixes | 1-2 days | None |
| Phase 2: Ghostnet & E2E | 2-3 days | Phase 1 |
| Phase 3: Enhancements | 3-5 days | Phase 2 (optional) |
| Phase 4: Pre-Mainnet | 5-7 days + audit time | Phase 2 |
| Phase 5: Mainnet | 3-5 days | Phase 4 |
| **Total** | **14-22 days** + audit time | - |

---

## Risk Assessment

### High Risk Items
1. **Security Audit Findings** - May require significant rework
2. **Data Migration** - Complex process with potential for data loss
3. **Mainnet Gas Costs** - May be higher than expected

### Mitigation Strategies
1. **Security**: Conduct thorough internal review before external audit
2. **Migration**: Test migration process multiple times on Ghostnet
3. **Gas Costs**: Optimize early and test on Ghostnet

---

## Conclusion

The migration is **substantially complete** with all core functionality implemented. The remaining work is primarily:
1. **Fixing build/test issues** (Phase 1)
2. **Validation through E2E testing** (Phase 2)
3. **Security and optimization** (Phase 4)
4. **Production deployment** (Phase 5)

**Recommended Next Step**: Begin Phase 1 immediately to unblock subsequent phases.

---

**Document Version**: 1.0  
**Last Updated**: February 8, 2026  
**Next Review**: After Phase 1 completion
