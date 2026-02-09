# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Continuum Protocol on Tezos.

## Table of Contents

1. [Wallet Connection Issues](#wallet-connection-issues)
2. [Transaction Failures](#transaction-failures)
3. [Stream Issues](#stream-issues)
4. [Compliance & KYC Issues](#compliance--kyc-issues)
5. [Display & UI Issues](#display--ui-issues)
6. [Network Issues](#network-issues)
7. [Gas & Fee Issues](#gas--fee-issues)
8. [Migration Issues](#migration-issues)
9. [Contract Interaction Issues](#contract-interaction-issues)
10. [Getting Help](#getting-help)

---

## Wallet Connection Issues

### Issue: Wallet Won't Connect

**Symptoms**:
- "Connect Wallet" button doesn't respond
- Wallet popup doesn't appear
- Connection fails silently

**Possible Causes**:
1. Wallet extension not installed
2. Wallet extension disabled
3. Browser compatibility issue
4. Multiple wallet extensions conflicting

**Solutions**:

**Step 1: Verify Wallet Installation**
```bash
# For Temple Wallet
1. Open browser extensions
2. Look for "Temple - Tezos Wallet"
3. Ensure it's enabled
4. If not installed, visit templewallet.com
```

**Step 2: Check Browser Compatibility**
- Supported browsers: Chrome, Firefox, Edge, Brave
- Not supported: Safari (limited support), Internet Explorer
- Try a different browser if issues persist

**Step 3: Disable Conflicting Extensions**
```bash
1. Open browser extensions
2. Temporarily disable other wallet extensions
3. Keep only Temple/Kukai/Umami enabled
4. Refresh the page
5. Try connecting again
```

**Step 4: Clear Browser Data**
```bash
1. Open browser settings
2. Clear browsing data
3. Select: Cookies, Cache, Site data
4. Time range: Last 24 hours
5. Clear data
6. Refresh page and reconnect
```

**Step 5: Reinstall Wallet**
```bash
1. Backup your seed phrase first!
2. Uninstall wallet extension
3. Restart browser
4. Reinstall wallet extension
5. Restore wallet using seed phrase
6. Try connecting again
```

### Issue: Wrong Network Detected

**Symptoms**:
- "Network mismatch" warning
- "Please switch to Ghostnet/Mainnet"
- Transactions fail with network error

**Solutions**:

**Step 1: Check Current Network**
```bash
1. Open your wallet
2. Look for network indicator (usually top right)
3. Should show "Ghostnet" or "Mainnet"
```

**Step 2: Switch Network in Wallet**

**Temple Wallet**:
```bash
1. Click wallet icon
2. Click network name (top)
3. Select correct network
4. Confirm switch
5. Refresh page
```

**Kukai Wallet**:
```bash
1. Open wallet
2. Settings → Network
3. Select correct network
4. Save
5. Refresh page
```

**Step 3: Verify Application Network**
```bash
1. Check network indicator in app (usually top right)
2. Should match your wallet network
3. If mismatch persists, clear cache and reconnect
```

### Issue: Wallet Disconnects Frequently

**Symptoms**:
- Wallet disconnects after a few minutes
- Need to reconnect repeatedly
- "Wallet not connected" errors

**Solutions**:

**Step 1: Check Wallet Settings**
```bash
1. Open wallet settings
2. Look for "Auto-lock" or "Session timeout"
3. Increase timeout duration
4. Save settings
```

**Step 2: Keep Wallet Unlocked**
```bash
1. Unlock wallet
2. Keep wallet extension open in background
3. Don't close wallet popup
```

**Step 3: Check Browser Settings**
```bash
1. Ensure browser isn't clearing cookies on close
2. Add app domain to exceptions
3. Disable "Clear cookies on exit"
```

**Step 4: Use "Remember Me"**
```bash
1. When connecting wallet
2. Look for "Remember this connection" checkbox
3. Enable it
4. Approve in wallet
```

---

## Transaction Failures

### Issue: "Insufficient Funds" Error

**Symptoms**:
- Transaction fails immediately
- Error: "Insufficient funds for gas"
- Can't submit transaction

**Solutions**:

**Step 1: Check XTZ Balance**
```bash
1. Open your wallet
2. Check XTZ balance
3. Need at least 0.1 XTZ for transactions
```

**Step 2: Get More XTZ**

**Ghostnet (Testnet)**:
```bash
1. Visit https://faucet.ghostnet.teztnets.xyz/
2. Enter your address (tz1...)
3. Request test XTZ
4. Wait 1-2 minutes
5. Check balance
```

**Mainnet (Production)**:
```bash
1. Buy XTZ on exchange (Coinbase, Kraken, Binance)
2. Withdraw to your Tezos address
3. Wait for confirmation (5-10 minutes)
4. Check balance
```

**Step 3: Reduce Transaction Size**
```bash
# If batch operation
1. Try smaller batch size
2. Split into multiple transactions
3. Process one at a time
```

### Issue: "Operation Failed" Error

**Symptoms**:
- Transaction submitted but fails
- Error in block explorer
- Funds deducted but operation didn't complete

**Solutions**:

**Step 1: Check Error Message**
```bash
1. Copy transaction hash
2. Visit tzkt.io
3. Paste hash in search
4. View error details
```

**Common Errors**:

**"NOT_AUTHORIZED"**:
```bash
Cause: You don't have permission
Solutions:
- Verify you own the NFT
- Check if you're the stream recipient
- Ensure you're using correct wallet
```

**"STREAM_NOT_FOUND"**:
```bash
Cause: Stream ID doesn't exist
Solutions:
- Verify stream ID is correct
- Check if stream was cancelled
- Query stream info first
```

**"KYC_NOT_VERIFIED"**:
```bash
Cause: KYC not approved
Solutions:
- Complete KYC verification
- Wait for admin approval
- Check compliance status
```

**"STREAM_FROZEN"**:
```bash
Cause: Stream is frozen by admin
Solutions:
- Contact admin for reason
- Wait for unfreeze
- Check frozen status
```

**Step 2: Increase Gas Limit**
```bash
1. When submitting transaction
2. Look for "Advanced" or "Gas" settings
3. Increase gas limit by 20%
4. Try again
```

**Step 3: Wait and Retry**
```bash
# Network might be congested
1. Wait 5-10 minutes
2. Try transaction again
3. Check network status at tezos.com
```

### Issue: Transaction Stuck "Pending"

**Symptoms**:
- Transaction shows "Pending" for long time
- No confirmation after 5+ minutes
- Can't submit new transactions

**Solutions**:

**Step 1: Check Transaction Status**
```bash
1. Copy transaction hash
2. Visit tzkt.io
3. Search for transaction
4. Check status
```

**Possible Statuses**:
- **Applied**: Success! Wait for UI to update
- **Failed**: See error message
- **Backtracked**: Reverted, try again
- **Not Found**: Still propagating, wait

**Step 2: Wait Longer**
```bash
# Tezos blocks are ~15 seconds
# Confirmation usually takes 1-3 blocks
1. Wait at least 2 minutes
2. Refresh page
3. Check again
```

**Step 3: Clear Pending State**
```bash
1. Disconnect wallet
2. Clear browser cache
3. Reconnect wallet
4. Check if transaction completed
```

**Step 4: Contact Support**
```bash
# If stuck for 10+ minutes
1. Note transaction hash
2. Take screenshot
3. Contact support with details
```

---

## Stream Issues

### Issue: Claimable Balance Shows Zero

**Symptoms**:
- Balance displays 0
- Can't claim yield
- Stream exists but no claimable amount

**Possible Causes & Solutions**:

**Cause 1: Stream Hasn't Started**
```bash
Check:
1. View stream details
2. Check start_time
3. Compare with current time

Solution:
- Wait until start_time
- Stream will begin accumulating then
```

**Cause 2: Just Claimed**
```bash
Check:
1. View transaction history
2. Look for recent "Withdraw" transaction

Solution:
- This is normal after claiming
- Wait for balance to accumulate again
```

**Cause 3: Flash Advance Used**
```bash
Check:
1. View stream details
2. Check amount_withdrawn vs time elapsed
3. If withdrawn > time_elapsed * flow_rate, you're "ahead"

Solution:
- Wait for time to catch up
- Calculate: (amount_withdrawn / flow_rate) - elapsed_time
- That's how long until next claimable
```

**Cause 4: Stream Ended**
```bash
Check:
1. View stream details
2. Check stop_time
3. Compare with current time

Solution:
- If current_time > stop_time, stream is complete
- Claim any remaining balance
- Stream is finished
```

**Cause 5: Stream Depleted**
```bash
Check:
1. View stream details
2. Check if amount_withdrawn == total_amount

Solution:
- Stream is fully withdrawn
- No more yield available
- Stream is complete
```

### Issue: Balance Not Updating in Real-Time

**Symptoms**:
- Balance stays static
- No live updates
- Need to refresh to see changes

**Solutions**:

**Step 1: Check JavaScript**
```bash
1. Open browser console (F12)
2. Look for JavaScript errors
3. Refresh page if errors present
```

**Step 2: Check Stream Status**
```bash
1. View stream details
2. Verify status is "Active"
3. Check if stream is paused or cancelled
```

**Step 3: Clear Cache**
```bash
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache
3. Reconnect wallet
```

**Step 4: Check Browser Compatibility**
```bash
# Real-time updates require modern browser
Supported:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Brave (latest)

Not supported:
- Internet Explorer
- Old Safari versions
```

### Issue: Can't Claim Yield

**Symptoms**:
- "Claim Yield" button disabled
- Transaction fails when claiming
- Error: "No funds to withdraw"

**Solutions**:

**Step 1: Verify Claimable Balance**
```bash
1. Check claimable balance > 0
2. If zero, wait for accumulation
3. Minimum claimable: Usually 1 token unit
```

**Step 2: Verify Ownership**
```bash
1. Check you own the NFT
2. Verify you're the stream recipient
3. Use correct wallet address
```

**Step 3: Check Compliance**
```bash
1. Verify KYC is approved
2. Check KYC hasn't expired
3. Verify whitelisted for asset type
4. Check stream isn't frozen
```

**Step 4: Check Stream Status**
```bash
1. View stream details
2. Status should be "Active"
3. If "Cancelled" or "Depleted", can't claim
```

---

## Compliance & KYC Issues

### Issue: "KYC Not Verified" Error

**Symptoms**:
- Can't create streams
- Can't claim yield
- Error: "KYC not verified"

**Solutions**:

**Step 1: Check KYC Status**
```bash
1. Go to Profile/Settings
2. Check KYC status
3. Should show "Verified"
```

**Step 2: Complete KYC**
```bash
If not verified:
1. Click "Complete KYC"
2. Submit required documents
3. Wait for approval (1-3 business days)
4. Check email for updates
```

**Step 3: Check Expiry**
```bash
1. View KYC details
2. Check expiry date
3. If expired, renew KYC
```

**Step 4: Contact Admin**
```bash
If verified but still getting error:
1. Take screenshot of KYC status
2. Note your wallet address
3. Contact support
4. Admin can check backend status
```

### Issue: "Not Whitelisted" Error

**Symptoms**:
- Can't create streams for certain asset types
- Error: "Not whitelisted for this asset type"
- KYC verified but still blocked

**Solutions**:

**Step 1: Check Whitelisting**
```bash
1. Go to Profile/Settings
2. View "Whitelisted Asset Types"
3. Check which types you have access to
```

**Asset Types**:
- 0 = Real Estate
- 1 = Vehicles
- 2 = Commodities

**Step 2: Request Whitelisting**
```bash
1. Contact admin via Discord or email
2. Specify which asset types you need
3. Provide reason for access
4. Wait for admin approval
```

**Step 3: Verify KYC First**
```bash
# Must have verified KYC before whitelisting
1. Complete KYC if not done
2. Wait for KYC approval
3. Then request whitelisting
```

### Issue: KYC Expired

**Symptoms**:
- Previously worked, now blocked
- Error: "KYC expired"
- Can't perform operations

**Solutions**:

**Step 1: Check Expiry Date**
```bash
1. Go to Profile/Settings
2. View KYC expiry date
3. Compare with current date
```

**Step 2: Renew KYC**
```bash
1. Click "Renew KYC"
2. Submit updated documents
3. Wait for approval
4. Check email for updates
```

**Step 3: Temporary Access**
```bash
# While waiting for renewal
1. Contact admin
2. Request temporary extension
3. Explain urgency
4. Admin may grant short extension
```

---

## Display & UI Issues

### Issue: Page Won't Load

**Symptoms**:
- Blank page
- Loading spinner forever
- "Failed to load" error

**Solutions**:

**Step 1: Check Internet Connection**
```bash
1. Verify internet is working
2. Try loading other websites
3. Check WiFi/Ethernet connection
```

**Step 2: Check Browser Console**
```bash
1. Press F12 to open developer tools
2. Go to Console tab
3. Look for error messages
4. Take screenshot if errors present
```

**Step 3: Clear Cache**
```bash
1. Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Time range: "All time"
4. Clear data
5. Refresh page
```

**Step 4: Try Different Browser**
```bash
1. Open in Chrome
2. Or Firefox
3. Or Edge
4. If works, issue is browser-specific
```

**Step 5: Check Site Status**
```bash
1. Visit status.continuum-protocol.com
2. Check if maintenance is ongoing
3. Follow Twitter for updates
```

### Issue: Images Not Loading

**Symptoms**:
- NFT images show broken icon
- Metadata not displaying
- Placeholder images only

**Solutions**:

**Step 1: Check IPFS Gateway**
```bash
# If using IPFS metadata
1. IPFS can be slow sometimes
2. Wait 30-60 seconds
3. Refresh page
```

**Step 2: Try Different IPFS Gateway**
```bash
# If image URL is ipfs://QmXxx...
Try these gateways:
- https://ipfs.io/ipfs/QmXxx...
- https://cloudflare-ipfs.com/ipfs/QmXxx...
- https://gateway.pinata.cloud/ipfs/QmXxx...
```

**Step 3: Check Metadata URI**
```bash
1. View NFT details
2. Copy metadata URI
3. Open in new tab
4. Verify JSON is valid
5. Check image URL in JSON
```

**Step 4: Report Broken Metadata**
```bash
If metadata is invalid:
1. Note NFT token ID
2. Contact support
3. Provide metadata URI
4. Admin can update if needed
```

### Issue: Numbers Display Incorrectly

**Symptoms**:
- Balances show as very large numbers
- Decimals in wrong place
- Scientific notation (1e+18)

**Cause**: Token decimals not applied

**Solutions**:

**Step 1: Refresh Page**
```bash
1. Hard refresh: Ctrl+Shift+R
2. Reconnect wallet
3. Check if fixed
```

**Step 2: Check Token Decimals**
```bash
# Most tokens use 6 decimals (mutez)
# 1 XTZ = 1,000,000 mutez
# 1 USDT = 1,000,000 micro-USDT

If you see: 1000000
It means: 1.000000 tokens
```

**Step 3: Report UI Bug**
```bash
If persists:
1. Take screenshot
2. Note which page/component
3. Report to GitHub issues
4. Include browser and version
```

---

## Network Issues

### Issue: "Network Error" or "RPC Error"

**Symptoms**:
- Can't load data
- Transactions fail to submit
- Error: "Failed to fetch"

**Solutions**:

**Step 1: Check RPC Status**
```bash
# Test RPC endpoint
curl https://ghostnet.ecadinfra.com/chains/main/blocks/head

# Should return JSON with block data
# If timeout or error, RPC is down
```

**Step 2: Try Different RPC**
```bash
Ghostnet RPCs:
- https://ghostnet.ecadinfra.com
- https://ghostnet.tezos.marigold.dev
- https://rpc.ghostnet.teztnets.xyz

Mainnet RPCs:
- https://mainnet.api.tez.ie
- https://mainnet.tezos.marigold.dev
- https://rpc.tzbeta.net
```

**Step 3: Configure Custom RPC**
```bash
# In application settings
1. Go to Settings
2. Find "RPC Endpoint"
3. Enter custom RPC URL
4. Save and refresh
```

**Step 4: Check Network Status**
```bash
1. Visit tezos.com
2. Check network status
3. Look for known issues
4. Follow @TezosFoundation on Twitter
```

### Issue: Slow Transaction Confirmation

**Symptoms**:
- Transactions take 5+ minutes
- Multiple blocks without confirmation
- "Pending" status for long time

**Causes & Solutions**:

**Cause 1: Network Congestion**
```bash
Check:
1. Visit tzkt.io
2. Look at recent blocks
3. Check transactions per block

Solution:
- Wait for congestion to clear
- Try during off-peak hours
- Increase gas limit slightly
```

**Cause 2: Low Gas Fee**
```bash
Check:
1. View transaction details
2. Compare gas fee with recent transactions

Solution:
- Cancel and resubmit with higher gas
- Or wait for confirmation
```

**Cause 3: RPC Issues**
```bash
Check:
1. Try different RPC endpoint
2. Check RPC response time

Solution:
- Switch to faster RPC
- Configure custom RPC
```

---

## Gas & Fee Issues

### Issue: "Gas Limit Exceeded"

**Symptoms**:
- Transaction fails
- Error: "Gas limit exceeded"
- Operation too complex

**Solutions**:

**Step 1: Increase Gas Limit**
```bash
1. When submitting transaction
2. Click "Advanced" or "Gas Settings"
3. Increase gas limit by 20-50%
4. Try again
```

**Step 2: Simplify Operation**
```bash
# If batch operation
1. Reduce batch size
2. Process in smaller chunks
3. Submit multiple transactions
```

**Step 3: Check Contract State**
```bash
# Large storage can increase gas
1. Verify contract addresses are correct
2. Check if operation is valid
3. Try on testnet first
```

### Issue: Fees Too High

**Symptoms**:
- Gas fee seems excessive
- Much higher than expected
- Can't afford transaction

**Solutions**:

**Step 1: Check Gas Estimation**
```bash
1. Review estimated gas before confirming
2. Compare with typical fees:
   - Simple transfer: ~0.01 XTZ
   - Stream creation: ~0.05 XTZ
   - Batch operation: ~0.1 XTZ
```

**Step 2: Wait for Lower Fees**
```bash
# Fees vary with network congestion
1. Check current network activity
2. Try during off-peak hours
3. Weekend/night usually cheaper
```

**Step 3: Optimize Transaction**
```bash
1. Combine multiple operations if possible
2. Use batch operations
3. Reduce unnecessary data
```

---

## Migration Issues

### Issue: Assets Not Showing After Migration

**Symptoms**:
- Connected to Tezos but no assets
- NFTs missing
- Streams not visible

**Solutions**:

**Step 1: Verify Correct Network**
```bash
1. Check you're on correct network (Ghostnet/Mainnet)
2. Verify wallet address
3. Ensure using Tezos wallet, not Aptos
```

**Step 2: Check Migration Status**
```bash
1. Visit migration status page
2. Verify migration completed
3. Check if your address was migrated
```

**Step 3: Refresh and Reconnect**
```bash
1. Disconnect wallet
2. Clear browser cache
3. Reconnect wallet
4. Wait for data to load
```

**Step 4: Verify on Block Explorer**
```bash
1. Visit tzkt.io
2. Enter your Tezos address
3. Check NFT holdings
4. Verify stream contracts
```

**Step 5: Contact Support**
```bash
If assets still missing:
1. Provide Aptos address
2. Provide Tezos address
3. List missing assets
4. Contact migration support
```

### Issue: Claimable Balance Different After Migration

**Symptoms**:
- Balance lower than expected
- Balance higher than expected
- Doesn't match Aptos balance

**Explanation**:

**Time Adjustment**:
```bash
# Migration takes time
# Streams continue accumulating during migration
# Balance may be slightly different

Expected difference:
- Migration duration: 4-6 hours
- Additional accumulation: flow_rate * migration_time
- This is normal and expected
```

**Solutions**:

**Step 1: Calculate Expected Balance**
```bash
# On Aptos before migration
Claimable_Aptos = X

# Time elapsed during migration
Migration_Time = 6 hours = 21,600 seconds

# Additional accumulation
Additional = flow_rate * 21,600

# Expected on Tezos
Expected_Tezos = X + Additional
```

**Step 2: Verify Stream Parameters**
```bash
1. Check total_amount matches
2. Check flow_rate matches
3. Check amount_withdrawn matches
4. Small differences are acceptable
```

**Step 3: Report Large Discrepancies**
```bash
If difference > 1%:
1. Note exact amounts (Aptos vs Tezos)
2. Provide stream IDs (both chains)
3. Contact migration support
4. Include screenshots
```

---

## Contract Interaction Issues

### Issue: "Contract Not Found"

**Symptoms**:
- Error: "Contract not found"
- Can't load contract data
- Operations fail

**Solutions**:

**Step 1: Verify Contract Address**
```bash
1. Check contract address in app
2. Should start with "KT1"
3. Should be 36 characters long
4. Verify on tzkt.io
```

**Step 2: Check Network**
```bash
# Ghostnet and Mainnet have different addresses
1. Verify you're on correct network
2. Check contract addresses match network
3. Switch network if needed
```

**Step 3: Update Contract Addresses**
```bash
# If using custom deployment
1. Go to Settings
2. Update contract addresses
3. Save and refresh
```

**Step 4: Clear Cache**
```bash
1. Clear browser cache
2. Disconnect wallet
3. Reconnect wallet
4. Reload contract data
```

### Issue: "Invalid Parameter" Error

**Symptoms**:
- Transaction fails
- Error: "Invalid parameter type"
- Parameter validation error

**Solutions**:

**Step 1: Check Input Format**
```bash
Common formats:
- Addresses: Must start with tz1/tz2/tz3 or KT1
- Amounts: Must be positive integers
- Durations: Must be in seconds
- Token IDs: Must be non-negative integers
```

**Step 2: Verify Required Fields**
```bash
1. Check all required fields are filled
2. No empty values
3. No null/undefined values
```

**Step 3: Check Value Ranges**
```bash
Common limits:
- Amount: > 0
- Duration: > 0, < 10 years
- Flow rate: > 0
- Asset type: 0, 1, or 2
```

**Step 4: Test on Ghostnet**
```bash
1. Try same operation on Ghostnet
2. If works, issue is with Mainnet data
3. If fails, issue is with parameters
```

---

## Getting Help

### Before Contacting Support

**Gather Information**:
1. ✅ Wallet address
2. ✅ Network (Ghostnet/Mainnet)
3. ✅ Browser and version
4. ✅ Error message (exact text)
5. ✅ Transaction hash (if applicable)
6. ✅ Screenshots
7. ✅ Steps to reproduce

### Support Channels

**Discord** (Fastest):
```
Server: discord.gg/continuum
Channels:
- #support: General help
- #technical: Technical issues
- #migration: Migration questions
- #bugs: Bug reports
```

**Email**:
```
General: support@continuum-protocol.com
Technical: tech@continuum-protocol.com
Migration: migration@continuum-protocol.com
Urgent: urgent@continuum-protocol.com
```

**GitHub Issues**:
```
Repository: github.com/continuum-protocol
For: Bug reports, feature requests
Include: Full error details, reproduction steps
```

**Twitter**:
```
@ContinuumProtocol
For: Status updates, announcements
Not for: Individual support requests
```

### Emergency Contacts

**Critical Issues** (funds at risk, security issues):
```
Discord: @admin (direct message)
Email: urgent@continuum-protocol.com
Response time: < 1 hour
```

**During Migration**:
```
Discord: #migration-live
Email: migration@continuum-protocol.com
Response time: < 15 minutes
```

### Self-Help Resources

**Documentation**:
- User Guide: [docs/USER_GUIDE.md](./USER_GUIDE.md)
- API Reference: [docs/API_REFERENCE.md](./API_REFERENCE.md)
- Migration Guide: [docs/USER_MIGRATION_GUIDE.md](./USER_MIGRATION_GUIDE.md)

**Video Tutorials**:
- YouTube: youtube.com/@ContinuumProtocol
- Topics: Wallet setup, creating streams, claiming yield

**Community**:
- Discord: Ask other users
- Telegram: Community chat
- Reddit: r/ContinuumProtocol

---

## Diagnostic Tools

### Check System Status

```bash
# Check if services are operational
curl https://status.continuum-protocol.com/api/status

# Check RPC health
curl https://ghostnet.ecadinfra.com/chains/main/blocks/head

# Check contract
curl https://api.ghostnet.tzkt.io/v1/contracts/KT1YourContract
```

### Browser Console Commands

```javascript
// Check wallet connection
console.log(window.tezos);

// Check network
console.log(await window.tezos.rpc.getChainId());

// Check balance
console.log(await window.tezos.tz.getBalance('tz1YourAddress'));

// Check contract storage
const contract = await window.tezos.contract.at('KT1Contract');
console.log(await contract.storage());
```

### Common Error Codes

```
Error Code | Meaning | Solution
-----------|---------|----------
001 | Wallet not connected | Connect wallet
002 | Wrong network | Switch network
003 | Insufficient funds | Get more XTZ
004 | KYC not verified | Complete KYC
005 | Not whitelisted | Request whitelisting
006 | Stream not found | Check stream ID
007 | Not authorized | Check ownership
008 | Stream frozen | Contact admin
009 | Invalid parameters | Check inputs
010 | Contract error | Check contract state
```

---

## Reporting Bugs

### Bug Report Template

```markdown
**Description**
Brief description of the issue

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120
- OS: Windows 11
- Network: Ghostnet
- Wallet: Temple 1.20.0

**Screenshots**
[Attach screenshots]

**Additional Context**
Any other relevant information
```

### Where to Report

**GitHub Issues**: For bugs and feature requests
**Discord #bugs**: For quick bug reports
**Email**: For sensitive issues

---

**Last Updated**: February 2026
**Version**: 1.0.0
