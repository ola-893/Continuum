# User Migration Guide: Aptos to Tezos

Welcome! This guide explains how the Continuum Protocol migration from Aptos to Tezos affects you as a user, and what you need to do.

## Table of Contents

1. [What's Happening?](#whats-happening)
2. [Why Are We Migrating?](#why-are-we-migrating)
3. [Timeline](#timeline)
4. [What You Need to Do](#what-you-need-to-do)
5. [What Happens to Your Assets](#what-happens-to-your-assets)
6. [Step-by-Step Migration](#step-by-step-migration)
7. [After Migration](#after-migration)
8. [FAQ](#faq)
9. [Support](#support)

---

## What's Happening?

Continuum Protocol is migrating from **Aptos blockchain** to **Tezos blockchain**. This means:

- All smart contracts are being redeployed on Tezos
- All your assets (NFTs) will be recreated on Tezos
- All your yield streams will continue on Tezos
- The frontend will connect to Tezos instead of Aptos

**Your assets are safe!** We're moving everything to the new blockchain.

---

## Why Are We Migrating?

### Benefits of Tezos

1. **Lower Gas Fees**: Transactions cost less on Tezos
2. **Better Ecosystem**: More DeFi integrations and tools
3. **Proven Security**: Tezos has a strong track record
4. **Energy Efficient**: Tezos uses proof-of-stake consensus
5. **Regulatory Clarity**: Better regulatory framework for RWAs

### What This Means for You

- ✅ Lower transaction costs
- ✅ Better wallet options (Temple, Kukai, Umami)
- ✅ More liquidity and trading options
- ✅ Improved user experience
- ✅ Same features you love

---

## Timeline

### Phase 1: Preparation (Weeks 1-3)

**What's happening**: Testing and preparation

**What you need to do**: Nothing yet! Just stay informed.

- We're testing the migration on testnets
- Contracts are being deployed to Tezos
- Frontend is being updated

### Phase 2: Announcement (Week 4)

**What's happening**: Official migration announcement

**What you need to do**: 
- Read the announcement carefully
- Install a Tezos wallet (Temple recommended)
- Note the migration date and time

### Phase 3: Migration Window (4-6 hours)

**What's happening**: Active migration

**What you need to do**:
- **DO NOT** create new streams during this time
- **DO NOT** transfer assets during this time
- Wait for completion announcement

**During migration**:
- ⏸️ Aptos platform will be in maintenance mode
- 📊 All data is being exported from Aptos
- 🔄 All data is being imported to Tezos
- ✅ Data integrity is being verified

### Phase 4: Verification (1-2 hours)

**What's happening**: Final checks

**What you need to do**: Wait for "all clear" announcement

### Phase 5: Go Live (Immediate)

**What's happening**: Tezos platform is live!

**What you need to do**:
- Connect your Tezos wallet
- Verify your assets
- Resume normal operations

### Phase 6: Grace Period (30 days)

**What's happening**: Both platforms available

**What you need to do**:
- Transition to Tezos
- Report any issues
- Claim any remaining yield on Aptos

### Phase 7: Aptos Sunset (After 30 days)

**What's happening**: Aptos platform closes

**What you need to do**:
- Ensure you've moved to Tezos
- All operations must be on Tezos

---

## What You Need to Do

### Before Migration

#### 1. Install a Tezos Wallet

Choose one:

**Temple Wallet** (Recommended):
- Visit [templewallet.com](https://templewallet.com/)
- Install browser extension
- Create new wallet
- **Save your seed phrase securely!**

**Kukai Wallet**:
- Visit [wallet.kukai.app](https://wallet.kukai.app/)
- Create account
- Enable 2FA

**Umami Wallet**:
- Visit [umamiwallet.com](https://umamiwallet.com/)
- Download app
- Create wallet

#### 2. Get Some XTZ

You'll need XTZ for transaction fees on Tezos:

**How much?**: 1-2 XTZ is enough for many transactions

**Where to get**:
- Buy on exchanges (Coinbase, Kraken, Binance)
- Swap from other crypto
- Receive from friends

**Cost**: ~$0.50-$5 per transaction (much cheaper than Ethereum!)

#### 3. Note Your Aptos Assets

Before migration, write down:
- Your Aptos wallet address
- List of your NFTs (token IDs)
- Active stream IDs
- Claimable yield amounts

**Why?**: To verify everything migrated correctly

#### 4. Claim Pending Yield (Optional)

You can claim your accumulated yield before migration:
- Go to Aptos platform
- Claim all pending yield
- Withdraw to your wallet

**Note**: If you don't claim, it will be preserved in the migration!

### During Migration (4-6 hours)

#### DO:
- ✅ Wait patiently
- ✅ Follow announcements
- ✅ Prepare your Tezos wallet

#### DON'T:
- ❌ Create new streams
- ❌ Transfer assets
- ❌ Claim yield
- ❌ Make any transactions

**Why?**: Transactions during migration may be lost or cause issues.

### After Migration

#### 1. Connect to Tezos Platform

- Visit [app.continuum-protocol.com](https://app.continuum-protocol.com)
- Click "Connect Wallet"
- Select your Tezos wallet
- Approve connection

#### 2. Verify Your Assets

Check that everything migrated:
- Go to "My Assets"
- Count your NFTs
- Check stream details
- Verify claimable balances

#### 3. Test a Small Transaction

Before doing anything major:
- Try claiming a small amount of yield
- Verify it works correctly
- Check gas fees

#### 4. Resume Normal Operations

Once verified:
- Claim yield as usual
- Transfer assets if needed
- Create new streams
- Everything works the same!

---

## What Happens to Your Assets

### Your NFTs

**Before Migration** (Aptos):
- NFT Token ID: #42
- Owner: 0xYourAptosAddress...
- Metadata: ipfs://QmXxx...

**After Migration** (Tezos):
- NFT Token ID: #42 (may be different number)
- Owner: tz1YourTezosAddress...
- Metadata: ipfs://QmXxx... (same!)

**What's preserved**:
- ✅ Ownership (you still own it)
- ✅ Metadata (same images, descriptions)
- ✅ Asset type (real estate, vehicle, etc.)

**What changes**:
- Token ID (new sequential number on Tezos)
- Contract address (new Tezos contract)

### Your Yield Streams

**Before Migration** (Aptos):
- Stream ID: #123
- Total Yield: 36,000 USDT
- Duration: 365 days
- Elapsed: 100 days
- Claimable: 9,863 USDT
- Withdrawn: 0 USDT

**After Migration** (Tezos):
- Stream ID: #123 (may be different number)
- Total Yield: 36,000 USDT (same!)
- Duration: 365 days (same!)
- Elapsed: 100 days (preserved!)
- Claimable: 9,863 USDT (preserved!)
- Withdrawn: 0 USDT (preserved!)

**What's preserved**:
- ✅ Total yield amount
- ✅ Duration
- ✅ Flow rate
- ✅ Amount withdrawn
- ✅ Claimable balance
- ✅ Sender and recipient

**What changes**:
- Stream ID (new sequential number)
- Start/stop times (adjusted to migration time)
- Contract address (new Tezos contract)

### Your Compliance Status

**Before Migration** (Aptos):
- KYC Status: Verified
- Jurisdiction: US
- Verification Level: Enhanced
- Whitelisted: Real Estate, Vehicles
- Expiry: 2027-01-01

**After Migration** (Tezos):
- KYC Status: Verified (preserved!)
- Jurisdiction: US (preserved!)
- Verification Level: Enhanced (preserved!)
- Whitelisted: Real Estate, Vehicles (preserved!)
- Expiry: 2027-01-01 (preserved!)

**What's preserved**:
- ✅ Everything! Your KYC status transfers completely

---

## Step-by-Step Migration

### For Asset Owners

#### Before Migration Day

1. **Install Tezos wallet** (Temple recommended)
2. **Get 1-2 XTZ** for gas fees
3. **Note your assets** (NFTs, streams, balances)
4. **Claim pending yield** (optional)
5. **Join Discord** for live updates

#### On Migration Day

**Morning** (Before maintenance):
1. Check announcement for exact timing
2. Claim any last-minute yield
3. Take screenshots of your assets
4. Wait for maintenance to begin

**During Maintenance** (4-6 hours):
1. Don't panic! Everything is being migrated
2. Follow live updates on Discord/Twitter
3. Prepare your Tezos wallet
4. Have your Tezos address ready

**After Maintenance**:
1. Visit new Tezos platform
2. Connect Tezos wallet
3. Verify your assets
4. Test a small transaction
5. Report any issues immediately

#### First Week After Migration

1. **Day 1**: Verify all assets, test basic operations
2. **Day 2-3**: Resume normal yield claims
3. **Day 4-7**: Transfer assets if needed, create new streams
4. **Week 2+**: Business as usual on Tezos!

### For Yield Recipients

#### Before Migration

1. **Install Tezos wallet**
2. **Get XTZ for gas**
3. **Note your claimable balances**
4. **Claim if you want** (or let it migrate)

#### After Migration

1. **Connect Tezos wallet**
2. **Verify your streams**
3. **Check claimable balances**
4. **Claim yield as usual**

### For Admins

#### Before Migration

1. **Coordinate with team**
2. **Prepare Tezos admin wallet**
3. **Review migration checklist**
4. **Test on Ghostnet first**

#### During Migration

1. **Monitor migration progress**
2. **Verify data integrity**
3. **Test admin functions**
4. **Prepare announcements**

#### After Migration

1. **Verify all data migrated**
2. **Test all admin functions**
3. **Monitor for issues**
4. **Support users**

---

## After Migration

### What's Different?

#### Wallet

- **Before**: Petra, Martian, or Pontem (Aptos wallets)
- **After**: Temple, Kukai, or Umami (Tezos wallets)

#### Gas Fees

- **Before**: Paid in APT
- **After**: Paid in XTZ (usually cheaper!)

#### Block Explorer

- **Before**: Aptos Explorer
- **After**: TzKT (tzkt.io)

#### Transaction Speed

- **Before**: ~4 seconds per block
- **After**: ~15 seconds per block (still fast!)

### What's the Same?

- ✅ Your assets and ownership
- ✅ Your yield streams
- ✅ Your claimable balances
- ✅ The user interface
- ✅ All features (streams, flash advance, etc.)
- ✅ Compliance requirements

### New Features on Tezos

After migration, you'll get:

1. **Better Wallet Options**: Temple, Kukai, Umami
2. **Lower Fees**: Cheaper transactions
3. **More Integrations**: DeFi, DEXs, marketplaces
4. **Better Tools**: TzKT explorer, Better Call Dev
5. **Improved Performance**: Optimized contracts

---

## FAQ

### General Questions

**Q: Will I lose my assets?**
A: No! All assets are migrated safely. You'll have the same NFTs and streams on Tezos.

**Q: Do I need to do anything?**
A: Yes, you need to:
1. Install a Tezos wallet
2. Get some XTZ for gas
3. Connect to the new platform after migration

**Q: Can I use the same wallet address?**
A: No, Aptos and Tezos use different address formats. You'll have a new Tezos address.

**Q: How long will migration take?**
A: 4-6 hours for the actual migration. Plan for a full day to be safe.

**Q: Can I still use Aptos after migration?**
A: Yes, for 30 days (grace period). After that, only Tezos will be available.

### Assets & Streams

**Q: What happens to my claimable yield?**
A: It's preserved! Your claimable balance migrates to Tezos.

**Q: Will my stream IDs change?**
A: Yes, Tezos will assign new sequential IDs. But all parameters are preserved.

**Q: What about my NFT metadata?**
A: Metadata URIs are preserved exactly. Your images and descriptions stay the same.

**Q: Can I claim yield during migration?**
A: No, wait until migration is complete.

### Technical Questions

**Q: Why Tezos instead of Ethereum or other chains?**
A: Tezos offers:
- Lower fees than Ethereum
- Better RWA ecosystem
- Proven security
- Energy efficiency
- Regulatory clarity

**Q: Are the smart contracts audited?**
A: Yes, all Tezos contracts undergo security audits before mainnet deployment.

**Q: What if something goes wrong?**
A: We have rollback procedures. Aptos contracts stay active until Tezos is fully verified.

**Q: How do I verify my assets migrated correctly?**
A: Compare your Aptos asset list with your Tezos assets. Check:
- Same number of NFTs
- Same stream parameters
- Same claimable balances

### Wallet & Setup

**Q: Which Tezos wallet should I use?**
A: Temple Wallet is recommended for beginners. It's easy to use and well-supported.

**Q: How much XTZ do I need?**
A: 1-2 XTZ is enough for many transactions. Each transaction costs ~0.01-0.1 XTZ.

**Q: Can I use a hardware wallet?**
A: Yes! Ledger and Trezor support Tezos. Connect through Temple or Kukai.

**Q: What if I lose my Tezos wallet?**
A: If you have your seed phrase, you can recover it. **Always backup your seed phrase!**

### Compliance

**Q: Do I need to redo KYC?**
A: No! Your KYC status migrates automatically.

**Q: What if my KYC expires during migration?**
A: Renew it before migration if possible. Otherwise, renew on Tezos after migration.

**Q: Will my whitelisting be preserved?**
A: Yes, your asset type permissions migrate completely.

### Timing

**Q: When exactly is the migration?**
A: We'll announce the exact date and time 2 weeks in advance. Follow our announcements!

**Q: What timezone?**
A: All times will be in UTC. We'll provide conversions for major timezones.

**Q: Can I request a different time?**
A: The migration time is chosen to minimize impact. We can't accommodate individual requests.

### After Migration

**Q: What if I find a problem after migration?**
A: Report it immediately:
- Discord: #migration-support
- Email: support@continuum-protocol.com
- GitHub: Open an issue

**Q: How long is the grace period?**
A: 30 days. Both Aptos and Tezos will be available during this time.

**Q: What happens after the grace period?**
A: Aptos platform closes. All operations must be on Tezos.

---

## Support

### Before Migration

**Questions?**
- Read this guide thoroughly
- Check our FAQ
- Join Discord for discussions
- Email: support@continuum-protocol.com

### During Migration

**Live Updates**:
- Discord: #migration-live
- Twitter: @ContinuumProtocol
- Website: Status banner

**Emergency Contact**:
- Discord: @admin
- Email: urgent@continuum-protocol.com

### After Migration

**Issues?**
- Discord: #migration-support
- Email: support@continuum-protocol.com
- GitHub: Open an issue

**Verification Help**:
- Discord: #verification
- Email: verify@continuum-protocol.com

### Resources

- **User Guide**: [docs/USER_GUIDE.md](./USER_GUIDE.md)
- **API Reference**: [docs/API_REFERENCE.md](./API_REFERENCE.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Technical Migration Guide**: [migration/MIGRATION_GUIDE.md](../migration/MIGRATION_GUIDE.md)

---

## Checklist

Use this checklist to prepare for migration:

### Before Migration

- [ ] Install Tezos wallet (Temple, Kukai, or Umami)
- [ ] Save seed phrase securely
- [ ] Get 1-2 XTZ for gas fees
- [ ] Note your Aptos assets (NFTs, streams, balances)
- [ ] Claim pending yield (optional)
- [ ] Join Discord for updates
- [ ] Read this guide completely
- [ ] Test wallet connection on Ghostnet (optional)

### During Migration

- [ ] Follow live updates
- [ ] Don't make any transactions
- [ ] Wait for completion announcement
- [ ] Have Tezos wallet ready

### After Migration

- [ ] Connect Tezos wallet to platform
- [ ] Verify all NFTs migrated
- [ ] Verify all streams migrated
- [ ] Check claimable balances
- [ ] Test a small transaction
- [ ] Report any issues
- [ ] Resume normal operations

### First Week

- [ ] Claim yield regularly
- [ ] Test all features
- [ ] Transfer assets if needed
- [ ] Create new streams if needed
- [ ] Provide feedback

---

## Important Dates

**Announcement**: [Date TBD]
**Migration Day**: [Date TBD]
**Grace Period Ends**: [Date TBD + 30 days]
**Aptos Sunset**: [Date TBD + 30 days]

*Dates will be announced 2 weeks in advance*

---

## Final Notes

### Stay Calm

- Migration is a normal process
- Your assets are safe
- We've tested extensively
- Support is available 24/7 during migration

### Stay Informed

- Follow our announcements
- Join Discord
- Read updates carefully
- Ask questions if unsure

### Stay Secure

- Never share your seed phrase
- Verify all URLs before connecting wallet
- Use official links only
- Report suspicious activity

---

**Welcome to Continuum Protocol on Tezos!** 🚀

We're excited about this migration and the benefits it brings. Thank you for being part of our community!

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Contact**: support@continuum-protocol.com
