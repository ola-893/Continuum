# Checkpoint 21: Action Items

**Priority**: Issues requiring immediate attention before Mainnet deployment

---

## 🔴 CRITICAL - Must Fix Before Mainnet

### 1. Contract Test Failures (3/6 failing)

**Issue**: Tests for compliance_guard, fa2_token, and rwa_hub are failing due to SmartPy compatibility.

**Error**:
```
AttributeError: module 'smartpy' has no attribute 'module'
```

**Root Cause**: Contracts use `@sp.module` decorator not available in SmartPy 0.19.2a3

**Solutions**:
- **Option A**: Upgrade SmartPy to latest version supporting `@sp.module`
- **Option B**: Refactor contracts to remove `@sp.module` decorator
- **Option C**: Update test imports to work around the issue

**Affected Files**:
- `tezos/contracts/compliance_guard.py`
- `tezos/contracts/fa2_token.py`
- `tezos/contracts/rwa_hub.py`
- `tezos/tests/test_compliance_guard.py`
- `tezos/tests/test_fa2_token.py`
- `tezos/tests/test_rwa_hub.py`

**Estimated Effort**: 2-4 hours

---

### 2. Frontend TypeScript Errors (45 errors)

**Issue**: Frontend has TypeScript compilation errors preventing clean builds.

**Error Categories**:

**A. Aptos SDK Imports (8 errors)**
Files still importing removed Aptos dependencies:
- `src/pages/MyRentals.tsx`
- `src/pages/Portfolio.tsx`
- `src/pages/Rentals.tsx`
- `src/services/aptosClient.ts`
- `src/services/aptosService.ts`
- `src/services/continuumService.ts`
- `src/services/nftMintingService.ts`

**B. StreamInfo Type Mismatches (15 errors)**
Mock data missing `sender` and `recipient` properties:
- `src/pages/MultiAssetDemo.tsx`
- `src/pages/MyRentals.tsx`
- `src/pages/Portfolio.tsx`

**C. Unused Variables (22 errors)**
Declared but unused variables (TS6133)

**Solutions**:
- Remove all Aptos SDK imports and replace with Tezos equivalents
- Update StreamInfo mock data to include all required properties
- Remove or use declared variables

**Estimated Effort**: 4-6 hours

---

### 3. Security Audit Required

**Issue**: No formal security audit has been performed.

**Risk**: Unknown vulnerabilities may exist in smart contracts.

**Required Actions**:
1. Engage professional security auditor
2. Provide complete codebase and documentation
3. Address all findings
4. Obtain audit report

**Status**: Task 24.1 not started

**Estimated Effort**: 2-3 weeks (external dependency)

**⚠️ MANDATORY before Mainnet deployment**

---

### 4. Property-Based Tests Missing (0/43 implemented)

**Issue**: No property-based tests implemented to verify correctness properties.

**Risk**: No formal verification that contracts behave correctly across all inputs.

**Minimum Required Properties** (for Mainnet):
- Properties 1-8: Streaming Protocol core logic
- Properties 14-18: Compliance and access control
- Properties 32-35: Security invariants

**Status**: All 43 property tests marked as optional

**Estimated Effort**: 
- Minimum (16 properties): 2-3 days
- Complete (43 properties): 1-2 weeks

**Recommendation**: Implement at least the minimum set before Mainnet

---

## 🟡 HIGH PRIORITY - Should Fix Before Mainnet

### 5. Gas Cost Optimization

**Issue**: Several operations exceed target gas costs.

**Operations Over Target**:
- `create_stream`: 45-55k (target: <50k)
- `withdraw`: 25-35k (target: <30k)
- `flash_advance`: 30-40k (target: <35k)
- `NFT transfer with hook`: 55-70k (target: <60k)
- `batch_whitelist (10 users)`: 90-120k (target: <100k)

**Required Actions**:
1. Profile gas usage in each operation
2. Optimize storage operations
3. Minimize big_map access
4. Test optimizations

**Status**: Task 24.3 not started

**Estimated Effort**: 3-5 days

---

### 6. End-to-End Testing Documentation

**Issue**: No documented E2E testing of user flows on Ghostnet.

**Required Test Flows**:
1. ✅ Create stream (likely tested during deployment)
2. ❓ Claim yield
3. ❓ Flash advance
4. ❓ NFT transfer with automatic yield update
5. ❓ Rental stream creation and access verification
6. ❓ Admin compliance management
7. ❓ Emergency freeze/unfreeze

**Required Actions**:
1. Manually test each flow on Ghostnet
2. Document test procedures and results
3. Fix any issues discovered
4. Create automated E2E tests (optional but recommended)

**Status**: Not documented

**Estimated Effort**: 1-2 days

---

### 7. Frontend Test Implementation

**Issue**: No frontend tests implemented.

**Missing Tests**:
- Wallet connection tests (Task 12.4)
- Contract interaction tests (Task 13.5)
- Balance calculation tests (Task 14.6)
- Admin dashboard tests (Task 15.8)
- Network configuration tests (Task 17.5)

**Required Actions**:
1. Set up Jest and React Testing Library
2. Implement critical test suites
3. Achieve >80% coverage on critical paths

**Status**: All marked as optional

**Estimated Effort**: 3-5 days

---

## 🟢 MEDIUM PRIORITY - Nice to Have

### 8. Complete Documentation

**Issue**: Comprehensive documentation incomplete.

**Missing Documentation** (Tasks 22.1-22.7):
- API reference documentation
- User guide (wallet connection, stream creation, yield claiming)
- Troubleshooting guide
- Detailed contract documentation

**Required Actions**:
1. Write API reference for all contract entrypoints
2. Create user-friendly guides with screenshots
3. Document common errors and solutions
4. Create video tutorials (optional)

**Status**: Tasks 22.1-22.7 not started

**Estimated Effort**: 1 week

---

### 9. Load Testing

**Issue**: No performance testing under high load.

**Required Actions**:
1. Set up load testing environment
2. Simulate high transaction volumes
3. Test concurrent user scenarios
4. Identify and fix bottlenecks
5. Document performance characteristics

**Status**: Task 24.2 not started

**Estimated Effort**: 2-3 days

---

### 10. Feature Parity Validation

**Issue**: No systematic validation of feature parity with Aptos.

**Required Actions**:
1. Create feature comparison checklist
2. Test all user flows side-by-side
3. Verify calculation accuracy (especially flash advance)
4. Document any differences
5. Implement Property 37 (Flash Advance Calculation Parity)

**Status**: Tasks 23.1-23.4 not started

**Estimated Effort**: 2-3 days

---

## Timeline Estimate

### Phase 1: Critical Fixes (Week 1)
- Fix contract test failures
- Fix frontend TypeScript errors
- Document E2E testing
- **Deliverable**: Clean builds, passing tests

### Phase 2: Security & Testing (Weeks 2-3)
- Implement critical property tests (Properties 1-8, 14-18, 32-35)
- Optimize gas costs
- Conduct security audit (external)
- **Deliverable**: Audited, tested contracts

### Phase 3: Polish & Documentation (Week 4)
- Complete documentation
- Implement frontend tests
- Perform load testing
- Feature parity validation
- **Deliverable**: Production-ready system

### Total Estimated Time: 3-4 weeks

---

## Decision Points

### Question 1: Property-Based Tests

**Options**:
- **A**: Implement all 43 properties (~2 weeks)
- **B**: Implement minimum 16 critical properties (~3 days)
- **C**: Skip property tests (not recommended for Mainnet)

**Recommendation**: Option B (minimum critical properties)

### Question 2: SmartPy Compatibility

**Options**:
- **A**: Upgrade SmartPy version (may break other things)
- **B**: Refactor contracts to remove `@sp.module` (significant work)
- **C**: Fix test imports only (quick fix)

**Recommendation**: Option C for immediate fix, Option A for long-term

### Question 3: Frontend Errors

**Options**:
- **A**: Fix all 45 errors immediately
- **B**: Fix critical errors only (Aptos imports, type mismatches)
- **C**: Suppress TypeScript errors (not recommended)

**Recommendation**: Option A (all errors should be fixed)

---

## Success Criteria

### Testnet/Ghostnet Ready ✅
- [x] All contracts deployed
- [x] Frontend functional
- [x] Basic testing complete

### Mainnet Ready ❌
- [ ] All tests passing (100% pass rate)
- [ ] No TypeScript errors
- [ ] Security audit complete
- [ ] Critical property tests implemented
- [ ] Gas costs optimized
- [ ] E2E testing documented
- [ ] Comprehensive documentation complete

---

## Next Steps

1. **Review this report** with the team
2. **Prioritize action items** based on timeline and resources
3. **Assign tasks** to team members
4. **Set deadlines** for each phase
5. **Schedule security audit** (long lead time)
6. **Begin Phase 1** (critical fixes)

---

**Report Generated**: February 8, 2026  
**Status**: Checkpoint 21 Complete  
**Next Checkpoint**: After Phase 1 completion
