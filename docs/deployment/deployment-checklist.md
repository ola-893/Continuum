# Deployment Checklist - Continuum Protocol

Use this checklist to ensure all steps are completed before and after deployment.

## Pre-Deployment Checklist

### Environment Setup
- [ ] SmartPy CLI installed and working
- [ ] Octez-client installed and configured
- [ ] Python 3.8+ installed
- [ ] Required Python packages installed (`requests`)
- [ ] Network connectivity to Ghostnet RPC verified
- [ ] Admin account created and funded (minimum 10 XTZ)

### Code Readiness
- [ ] All contracts compiled successfully
- [ ] All unit tests passing (90%+ coverage required)
- [ ] Property-based tests passing (optional but recommended)
- [ ] No SmartPy version issues (use stable 0.18.x)
- [ ] Code reviewed and approved
- [ ] Security considerations addressed

### Configuration
- [ ] `config/ghostnet.json` reviewed and correct
- [ ] RPC endpoint accessible
- [ ] Admin address verified
- [ ] Backup RPC endpoint configured

### Documentation
- [ ] Deployment guide reviewed
- [ ] Manual testing guide prepared
- [ ] Contract addresses documented
- [ ] Rollback plan prepared

## Deployment Checklist

### Phase 1: Contract Compilation
- [ ] Streaming Protocol compiled
- [ ] Asset Yield Protocol compiled
- [ ] Compliance Guard compiled
- [ ] Token Registry compiled
- [ ] FA2 Token compiled
- [ ] RWA Hub compiled
- [ ] All Michelson files generated in `output_deploy/`

### Phase 2: Contract Origination

#### Streaming Protocol
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded (KT1...)
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

#### Asset Yield Protocol
- [ ] Streaming Protocol address provided
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

#### Compliance Guard
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

#### Token Registry
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

#### FA2 Token
- [ ] Asset Yield Protocol address provided
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

#### RWA Hub
- [ ] All dependency addresses provided
- [ ] Origination command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Address added to `config/ghostnet.json`
- [ ] Contract visible on block explorer

### Phase 3: Verification
- [ ] Verification script executed: `python verify_deployment.py --network ghostnet`
- [ ] All contracts exist on-chain
- [ ] Storage initialized correctly
- [ ] Admin addresses configured
- [ ] Cross-contract references correct
- [ ] No verification errors

## Post-Deployment Checklist

### Manual Testing
- [ ] Test 1: Register KYC identity - PASSED
- [ ] Test 2: Whitelist address - PASSED
- [ ] Test 3: Mint NFT - PASSED
- [ ] Test 4: Create stream - PASSED
- [ ] Test 5: Withdraw from stream - PASSED
- [ ] Test 6: Flash advance - PASSED
- [ ] Test 7: Create asset yield stream - PASSED
- [ ] Test 8: Claim yield - PASSED
- [ ] Test 9: Transfer NFT (with hook) - PASSED
- [ ] Test 10: Register token - PASSED
- [ ] Test 11: Create compliant RWA stream - PASSED
- [ ] Test 12: Compliant claim yield - PASSED
- [ ] Test 13: Stream rent to asset - PASSED
- [ ] Test 14: Freeze stream - PASSED
- [ ] Test 15: Unfreeze stream - PASSED

### Integration Testing
- [ ] End-to-end user flow tested
- [ ] Admin functions tested
- [ ] Error handling verified
- [ ] Gas costs measured and acceptable
- [ ] Events emitted correctly

### Documentation Updates
- [ ] Contract addresses documented
- [ ] Deployment date recorded
- [ ] Gas costs documented
- [ ] Known issues documented
- [ ] Frontend configuration updated

### Frontend Integration
- [ ] Frontend config updated with contract addresses
- [ ] Frontend deployed to test environment
- [ ] Wallet connection tested
- [ ] Contract interactions tested
- [ ] Real-time balance updates working
- [ ] Admin dashboard functional

### Monitoring Setup
- [ ] Block explorer bookmarks created
- [ ] Contract addresses shared with team
- [ ] Monitoring alerts configured (if applicable)
- [ ] Analytics tracking set up

### Communication
- [ ] Team notified of deployment
- [ ] Deployment summary shared
- [ ] Testing instructions provided
- [ ] Known issues communicated
- [ ] Next steps outlined

## Deployment Summary Template

```
Continuum Protocol - Ghostnet Deployment Summary

Date: [YYYY-MM-DD]
Deployer: [Admin Address]
Network: Ghostnet
RPC Endpoint: [URL]

Contract Addresses:
- Streaming Protocol: KT1...
- Asset Yield Protocol: KT1...
- Compliance Guard: KT1...
- Token Registry: KT1...
- FA2 Token: KT1...
- RWA Hub: KT1...

Deployment Costs:
- Total Gas: ~XXX,XXX
- Total Storage: ~XX,XXX bytes
- Total XTZ: ~X.X XTZ

Verification Status:
- All contracts deployed: ✓
- Storage initialized: ✓
- Cross-contract refs: ✓
- Manual testing: ✓

Known Issues:
- [List any issues found during testing]

Next Steps:
1. [Next action item]
2. [Next action item]
3. [Next action item]

Block Explorer:
https://ghostnet.tzkt.io

Notes:
[Any additional notes or observations]
```

## Rollback Plan

If deployment fails or critical issues are found:

### Immediate Actions
1. Stop all testing and usage
2. Document the issue in detail
3. Notify team immediately
4. Preserve all logs and transaction hashes

### Analysis
1. Identify root cause
2. Determine if issue is fixable
3. Assess impact on deployed contracts
4. Decide on fix vs. redeploy

### Resolution Options

**Option A: Fix and Continue**
- If issue is minor and fixable
- Deploy fix or workaround
- Re-test affected functionality
- Continue with deployment

**Option B: Redeploy**
- If issue is critical or unfixable
- Fix contracts locally
- Re-compile and re-test
- Deploy new versions
- Update all references

**Option C: Abort**
- If issues are too severe
- Document lessons learned
- Plan for future deployment
- Communicate to stakeholders

## Sign-Off

### Pre-Deployment
- [ ] Technical Lead: _________________ Date: _______
- [ ] Security Reviewer: ______________ Date: _______
- [ ] Project Manager: _______________ Date: _______

### Post-Deployment
- [ ] Deployment Engineer: ___________ Date: _______
- [ ] QA Tester: ____________________ Date: _______
- [ ] Technical Lead: ________________ Date: _______

## Notes

Use this space for any additional notes, observations, or issues encountered during deployment:

```
[Your notes here]
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-06  
**Maintained By:** Continuum Protocol Team
