# Continuum Protocol User Guide

Welcome to the Continuum Protocol! This guide will help you get started with tokenizing real-world assets, earning continuous yield, and managing your RWA portfolio on Tezos.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Connecting Your Wallet](#connecting-your-wallet)
4. [Understanding Streams](#understanding-streams)
5. [Creating Yield Streams](#creating-yield-streams)
6. [Claiming Yield](#claiming-yield)
7. [Using Flash Advance](#using-flash-advance)
8. [Transferring Assets](#transferring-assets)
9. [Rental Streams](#rental-streams)
10. [Compliance & KYC](#compliance--kyc)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

### What is Continuum Protocol?

Continuum Protocol is a decentralized platform for tokenizing real-world assets (RWAs) with continuous yield distribution. Unlike traditional platforms that require manual yield claims, Continuum streams yield continuously to asset owners, similar to how a salary is earned over time.

### Key Features

- **Continuous Yield Streaming**: Earn yield every second, not just at fixed intervals
- **Flash Advance**: Borrow against your own future yield without interest
- **Automatic Yield Transfer**: When you sell an asset, yield automatically follows the new owner
- **Compliance Built-In**: KYC/AML checks ensure regulatory compliance
- **Multi-Asset Support**: Real estate, vehicles, commodities, and more

### Supported Asset Types

1. **Real Estate** (Type 0): Residential and commercial properties
2. **Vehicles** (Type 1): Cars, boats, aircraft
3. **Commodities** (Type 2): Gold, silver, agricultural products

---

## Getting Started

### Prerequisites

Before using Continuum Protocol, you'll need:

1. **A Tezos Wallet**: Temple, Kukai, or Umami
2. **XTZ Tokens**: For transaction fees (gas)
3. **KYC Verification**: Complete identity verification (for asset owners)

### Installation

#### Step 1: Install a Tezos Wallet

Choose one of the supported wallets:

**Temple Wallet** (Recommended for beginners):
1. Visit [https://templewallet.com/](https://templewallet.com/)
2. Install the browser extension
3. Create a new wallet or import existing
4. Save your seed phrase securely

**Kukai Wallet** (Web-based):
1. Visit [https://wallet.kukai.app/](https://wallet.kukai.app/)
2. Create account with email or social login
3. Secure your account with 2FA

**Umami Wallet** (Advanced users):
1. Visit [https://umamiwallet.com/](https://umamiwallet.com/)
2. Download desktop or mobile app
3. Create new wallet

#### Step 2: Get Test XTZ (Ghostnet Only)

If you're using the testnet:

1. Visit [https://faucet.ghostnet.teztnets.xyz/](https://faucet.ghostnet.teztnets.xyz/)
2. Enter your Tezos address (starts with tz1, tz2, or tz3)
3. Request test XTZ
4. Wait for confirmation (usually < 1 minute)

#### Step 3: Access Continuum Protocol

1. Visit [https://app.continuum-protocol.com](https://app.continuum-protocol.com)
2. Select your network (Ghostnet for testing, Mainnet for production)
3. Click "Connect Wallet"

---

## Connecting Your Wallet

### First-Time Connection

1. **Click "Connect Wallet"** in the top right corner
2. **Select your wallet** from the list (Temple, Kukai, or Umami)
3. **Approve the connection** in your wallet popup
4. **Verify your address** is displayed correctly

### Network Selection

The application automatically detects your wallet's network. Ensure you're on the correct network:

- **Ghostnet**: For testing (free test tokens)
- **Mainnet**: For real assets (real XTZ required)

If you see a network mismatch warning:
1. Open your wallet
2. Switch to the correct network
3. Refresh the page

### Disconnecting

To disconnect your wallet:
1. Click your address in the top right
2. Select "Disconnect"
3. Your wallet will be disconnected

---

## Understanding Streams

### What is a Stream?

A stream is a continuous payment flow that distributes tokens over time. Think of it like a salary that's earned every second rather than paid monthly.

### Stream Components

- **Sender**: Who funds the stream
- **Recipient**: Who receives the tokens
- **Total Amount**: Total tokens to be distributed
- **Flow Rate**: Tokens distributed per second
- **Duration**: How long the stream lasts
- **Start Time**: When streaming begins
- **Stop Time**: When streaming ends

### Stream States

- **Active**: Stream is running, tokens are accumulating
- **Paused**: Stream is temporarily stopped (after flash advance)
- **Cancelled**: Stream was terminated early
- **Depleted**: All tokens have been withdrawn

### Calculating Your Balance

Your claimable balance at any time is:

```
Claimable = (Current Time - Start Time) × Flow Rate - Amount Already Withdrawn
```

The UI calculates this automatically and updates every second!


---

## Creating Yield Streams

### Prerequisites

Before creating a yield stream:
1. ✅ Wallet connected
2. ✅ KYC verified
3. ✅ Whitelisted for asset type
4. ✅ Own an NFT representing the asset
5. ✅ Have XTZ for gas fees

### Step-by-Step Guide

#### Step 1: Navigate to Create Stream

1. Go to the Dashboard
2. Click "Create New Stream"
3. Or go to "My Assets" → "Add Yield Stream"

#### Step 2: Enter Asset Details

Fill in the form:

**Asset Information**:
- **NFT Address**: The contract address of your asset NFT
- **Asset Type**: Select Real Estate, Vehicles, or Commodities
- **Metadata URI**: IPFS or HTTP URL to asset metadata

**Yield Parameters**:
- **Total Yield**: Total amount of tokens to distribute (e.g., 1,000,000)
- **Duration**: How long to distribute (e.g., 365 days)
- **Token**: Which token to use for yield (usually USDT or similar)

**Example**:
```
NFT Address: KT1abc123...
Asset Type: Real Estate
Total Yield: 36,000 USDT
Duration: 365 days
Flow Rate: ~0.00114 USDT per second (calculated automatically)
```

#### Step 3: Review and Confirm

1. Review the summary:
   - Daily yield: 98.63 USDT
   - Monthly yield: ~3,000 USDT
   - Annual yield: 36,000 USDT
2. Check estimated gas fee
3. Click "Create Stream"

#### Step 4: Approve in Wallet

1. Your wallet will open
2. Review the transaction details
3. Click "Confirm"
4. Wait for confirmation (~30 seconds)

#### Step 5: Success!

Once confirmed:
- Your stream is created
- Yield starts accumulating immediately
- You can view it in "My Streams"

### Tips for Creating Streams

- **Choose realistic durations**: 1-5 years is common for real estate
- **Consider tax implications**: Consult with a tax professional
- **Start small**: Test with a small amount first on Ghostnet
- **Save your stream ID**: You'll need it for reference

---

## Claiming Yield

### When to Claim

You can claim your accumulated yield at any time! There's no minimum or maximum waiting period.

**Common claiming strategies**:
- **Monthly**: Claim once per month for regular income
- **As needed**: Claim when you need funds
- **Let it accumulate**: Wait until the end for maximum balance

### How to Claim Yield

#### Method 1: From Dashboard

1. Go to Dashboard
2. Find your asset card
3. See your claimable balance (updates every second!)
4. Click "Claim Yield"
5. Confirm in your wallet
6. Tokens are transferred to your wallet

#### Method 2: From Asset Details

1. Go to "My Assets"
2. Click on an asset
3. View detailed stream information
4. Click "Claim Yield"
5. Confirm transaction

### What Happens When You Claim

1. **Calculation**: System calculates your exact claimable balance
2. **Transfer**: Tokens are transferred from escrow to your wallet
3. **Update**: Your "Amount Withdrawn" increases
4. **Reset**: Your claimable balance resets to zero
5. **Continue**: Stream continues accumulating from zero

### Claiming Costs

- **Gas Fee**: Small XTZ fee (~0.01-0.05 XTZ)
- **No Protocol Fee**: Continuum doesn't charge for claims
- **Instant**: Tokens arrive immediately after confirmation

### Example

```
Stream Details:
- Total Yield: 36,000 USDT
- Duration: 365 days
- Started: January 1, 2026
- Current Date: February 1, 2026 (31 days elapsed)

Calculation:
- Daily Rate: 36,000 / 365 = 98.63 USDT/day
- Elapsed: 31 days
- Claimable: 31 × 98.63 = 3,057.53 USDT

After Claiming:
- You receive: 3,057.53 USDT
- Remaining in stream: 32,942.47 USDT
- Stream continues for 334 more days
```

---

## Using Flash Advance

### What is Flash Advance?

Flash Advance lets you borrow against your own future yield **without interest, collateral, or approval**. It's like getting your future salary early.

### How It Works

1. You request an advance (e.g., 5,000 USDT)
2. Tokens are transferred immediately
3. Your "Amount Withdrawn" increases by 5,000
4. Future yield accumulation continues
5. Your next claimable balance starts from the new baseline

### When to Use Flash Advance

**Good use cases**:
- Emergency expenses
- Investment opportunities
- Paying off high-interest debt
- Business cash flow needs

**Not recommended for**:
- Speculative trading
- Non-essential purchases
- When you're unsure about future yield

### Step-by-Step Guide

#### Step 1: Navigate to Flash Advance

1. Go to "My Assets"
2. Select an asset
3. Click "Flash Advance"

#### Step 2: Enter Amount

1. See your maximum available advance
2. Enter the amount you want
3. Review the impact:
   - Immediate transfer: X USDT
   - Remaining yield: Y USDT
   - Days until next claimable: Z days

#### Step 3: Confirm

1. Click "Request Flash Advance"
2. Confirm in your wallet
3. Tokens arrive immediately

### Example Scenario

```
Before Flash Advance:
- Total Yield: 36,000 USDT
- Elapsed: 100 days
- Already Withdrawn: 0 USDT
- Claimable Now: 9,863 USDT
- Remaining: 26,137 USDT

Flash Advance Request: 15,000 USDT

After Flash Advance:
- You receive immediately: 15,000 USDT
- New Amount Withdrawn: 15,000 USDT
- Claimable Now: 0 USDT (you're "ahead")
- Days to catch up: ~52 days
- After 52 days: Back to normal accumulation
```

### Important Notes

- **No interest**: You're borrowing from yourself
- **No approval needed**: It's your yield
- **Reduces future claims**: You can't claim again until time catches up
- **Maximum limit**: Can't exceed total remaining yield
- **Irreversible**: Can't "undo" a flash advance

---

## Transferring Assets

### Automatic Yield Transfer

When you transfer an NFT, the yield stream **automatically follows the new owner**. This is a key feature of Continuum Protocol!

### How It Works

1. You transfer the NFT to a new owner
2. The FA2 transfer hook triggers
3. Asset Yield Protocol updates the stream recipient
4. New owner immediately starts earning yield
5. You can no longer claim from that stream

### Step-by-Step Transfer

#### Step 1: Prepare for Transfer

1. Claim any accumulated yield first (optional but recommended)
2. Note your stream details for records
3. Ensure recipient address is correct

#### Step 2: Transfer the NFT

1. Go to "My Assets"
2. Select the asset to transfer
3. Click "Transfer Asset"
4. Enter recipient address (tz1...)
5. Review details carefully
6. Click "Transfer"

#### Step 3: Confirm Transaction

1. Wallet popup appears
2. Review:
   - Recipient address
   - Token ID
   - Gas fee
3. Click "Confirm"
4. Wait for confirmation

#### Step 4: Verify Transfer

1. Check "My Assets" - asset should be gone
2. New owner can see it in their dashboard
3. New owner can immediately claim yield

### Important Considerations

**Before Transferring**:
- ✅ Claim accumulated yield
- ✅ Double-check recipient address
- ✅ Understand you lose future yield
- ✅ Consider tax implications

**After Transferring**:
- ❌ You can't claim yield anymore
- ❌ You can't reverse the transfer
- ✅ New owner has full control
- ✅ Stream continues uninterrupted

### Selling Assets

When selling an asset:

1. **Agree on price** with buyer
2. **Claim your yield** up to sale date
3. **Transfer the NFT** to buyer
4. **Receive payment** (off-chain or on-chain)
5. **Buyer gets future yield** automatically

### Example

```
Scenario: Selling apartment NFT

Before Sale:
- You own: Apartment NFT #42
- Stream: 36,000 USDT over 365 days
- Elapsed: 100 days
- Claimable: 9,863 USDT

Sale Process:
1. Claim 9,863 USDT yield
2. Agree on sale price: 500,000 USDT
3. Transfer NFT to buyer
4. Receive 500,000 USDT payment

After Sale:
- Buyer owns: Apartment NFT #42
- Buyer gets: Remaining 26,137 USDT yield over 265 days
- You have: 9,863 USDT yield + 500,000 USDT sale price
```

---

## Rental Streams

### What are Rental Streams?

Rental streams enable pay-as-you-go access to assets. Tenants create payment streams to landlords, and the stream status controls physical access (via IoT integration).

### For Landlords (Asset Owners)

#### Setting Up Rentals

1. Own an RWA NFT (e.g., apartment, car)
2. Integrate IoT access control (smart lock, car starter)
3. Advertise rental terms (price, duration)
4. Wait for tenant to create rental stream

#### Receiving Rental Payments

1. Tenant creates rental stream to you
2. You receive continuous payments
3. Payments stream in real-time
4. Claim anytime or let accumulate

### For Tenants

#### Renting an Asset

**Step 1: Find an Asset**
1. Browse marketplace
2. Find asset to rent
3. Check rental terms

**Step 2: Create Rental Stream**
1. Click "Rent This Asset"
2. Enter rental details:
   - Duration (e.g., 30 days)
   - Total payment (e.g., 3,000 USDT)
3. Approve token transfer
4. Confirm transaction

**Step 3: Access the Asset**
1. Stream is created
2. IoT system verifies stream status
3. You get access (smart lock unlocks, car starts)
4. Access continues while stream is active

**Step 4: End of Rental**
1. Stream ends after duration
2. Access is automatically revoked
3. No further action needed

### Access Control

Access is granted when:
- ✅ Rental stream exists
- ✅ Stream status is ACTIVE
- ✅ Stream recipient is current NFT owner
- ✅ Current time is within stream duration

Access is revoked when:
- ❌ Stream ends
- ❌ Stream is cancelled
- ❌ NFT is transferred to new owner
- ❌ Stream is frozen by admin

### Example: Renting an Apartment

```
Rental Terms:
- Asset: Luxury Apartment #42
- Monthly Rent: 3,000 USDT
- Duration: 30 days

Tenant Actions:
1. Create rental stream:
   - To: Current apartment owner
   - Amount: 3,000 USDT
   - Duration: 2,592,000 seconds (30 days)
   - Flow Rate: 0.001157 USDT/second

2. Access granted:
   - Smart lock receives stream ID
   - Verifies stream is active
   - Unlocks door

3. During rental:
   - Landlord receives ~100 USDT/day
   - Tenant has 24/7 access
   - Stream accumulates continuously

4. End of rental:
   - Stream ends after 30 days
   - Smart lock checks stream status
   - Access is revoked
   - Landlord has received full 3,000 USDT
```

---

## Compliance & KYC

### Why KYC is Required

Continuum Protocol complies with financial regulations by requiring KYC (Know Your Customer) verification for asset owners and traders.

### KYC Verification Levels

1. **Basic** (Level 0):
   - Identity verification
   - Address verification
   - Suitable for: Small assets, personal use

2. **Enhanced** (Level 1):
   - Basic + income verification
   - Source of funds check
   - Suitable for: Medium assets, regular trading

3. **Institutional** (Level 2):
   - Enhanced + business verification
   - Compliance documentation
   - Suitable for: Large assets, institutional investors

### How to Complete KYC

#### Step 1: Start Verification

1. Go to "Profile" or "Settings"
2. Click "Complete KYC"
3. Select verification level

#### Step 2: Submit Documents

Required documents (varies by level):
- Government-issued ID (passport, driver's license)
- Proof of address (utility bill, bank statement)
- Selfie with ID
- Additional documents for higher levels

#### Step 3: Wait for Approval

- Processing time: 1-3 business days
- You'll receive email notification
- Check status in your profile

#### Step 4: Get Whitelisted

After KYC approval:
1. Admin whitelists you for asset types
2. You can now create streams
3. You can trade assets

### Whitelisting

Whitelisting grants access to specific asset types:

- **Real Estate**: Residential and commercial properties
- **Vehicles**: Cars, boats, aircraft
- **Commodities**: Gold, silver, agricultural products

You must be whitelisted for each asset type you want to trade.

### Compliance Checks

Every transaction checks:
1. ✅ KYC is verified
2. ✅ KYC is not expired
3. ✅ User is whitelisted for asset type
4. ✅ Stream is not frozen

If any check fails, the transaction is rejected.

### Maintaining Compliance

- **Renew KYC**: Before expiry date
- **Update information**: If address or details change
- **Monitor status**: Check your compliance dashboard
- **Respond to requests**: If admin requests additional info

---

## Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet won't connect

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Disable other wallet extensions
4. Try a different browser
5. Reinstall wallet extension

**Problem**: Network mismatch warning

**Solutions**:
1. Open your wallet
2. Switch to correct network (Ghostnet or Mainnet)
3. Refresh the page

### Transaction Failures

**Problem**: Transaction fails with "Insufficient funds"

**Solutions**:
1. Check XTZ balance for gas fees
2. Get more XTZ from faucet (Ghostnet) or exchange (Mainnet)
3. Try again

**Problem**: Transaction fails with "Not authorized"

**Solutions**:
1. Verify you own the NFT
2. Check if you're the stream recipient
3. Ensure you're using the correct wallet address

**Problem**: Transaction fails with "KYC not verified"

**Solutions**:
1. Complete KYC verification
2. Wait for admin approval
3. Check your compliance status

**Problem**: Transaction fails with "Not whitelisted"

**Solutions**:
1. Contact admin to request whitelisting
2. Verify your KYC is approved
3. Check which asset types you're whitelisted for

### Stream Issues

**Problem**: Claimable balance shows zero

**Possible causes**:
1. Stream hasn't started yet (check start time)
2. You recently claimed (balance resets after claim)
3. You used flash advance (need to wait for time to catch up)
4. Stream is depleted (all tokens withdrawn)

**Problem**: Can't claim yield

**Solutions**:
1. Verify you own the NFT
2. Check if stream is frozen
3. Ensure claimable balance > 0
4. Check your compliance status

**Problem**: Balance not updating

**Solutions**:
1. Refresh the page
2. Check if stream is active
3. Verify stream hasn't ended
4. Clear browser cache

### General Issues

**Problem**: Page won't load

**Solutions**:
1. Check internet connection
2. Try different browser
3. Clear cache and cookies
4. Disable ad blockers
5. Check if site is under maintenance

**Problem**: Slow transactions

**Causes**:
1. Network congestion
2. Low gas fee
3. RPC endpoint issues

**Solutions**:
1. Wait a few minutes
2. Increase gas limit
3. Try again later

---

## FAQ

### General Questions

**Q: What is Continuum Protocol?**
A: A decentralized platform for tokenizing real-world assets with continuous yield streaming on Tezos blockchain.

**Q: What assets can I tokenize?**
A: Real estate, vehicles, commodities, and other income-generating assets.

**Q: Do I need cryptocurrency experience?**
A: Basic knowledge helps, but our interface is designed for beginners. Follow this guide step-by-step.

**Q: Is my money safe?**
A: Funds are secured by smart contracts on Tezos blockchain. Always verify contract addresses and use official links.

### Wallet & Setup

**Q: Which wallet should I use?**
A: Temple Wallet is recommended for beginners. Kukai and Umami are also supported.

**Q: Do I need XTZ?**
A: Yes, for transaction fees (gas). Usually 0.01-0.1 XTZ per transaction.

**Q: Can I use the same wallet on mobile and desktop?**
A: Yes, most wallets support both. Use your seed phrase to restore on different devices.

### Streams & Yield

**Q: How often can I claim yield?**
A: Anytime! There's no minimum waiting period.

**Q: What happens if I don't claim for a long time?**
A: Yield continues accumulating. You can claim it all at once whenever you want.

**Q: Can I cancel a stream?**
A: Yes, sender or recipient can cancel. Remaining funds are refunded to sender.

**Q: What happens when a stream ends?**
A: You can claim all remaining yield. The stream status becomes "depleted" after full withdrawal.

### Flash Advance

**Q: Is flash advance a loan?**
A: No, you're withdrawing your own future yield early. No interest, no approval needed.

**Q: Can I flash advance more than once?**
A: Yes, as long as you have remaining yield available.

**Q: What if I flash advance too much?**
A: You can't exceed your total remaining yield. The system prevents over-withdrawal.

### Transfers & Trading

**Q: What happens to yield when I sell an asset?**
A: Yield automatically transfers to the new owner. Claim your accumulated yield before selling!

**Q: Can I transfer just the yield stream without the NFT?**
A: No, yield is permanently linked to the NFT. They transfer together.

**Q: How do I price my asset for sale?**
A: Consider the asset value plus remaining yield. Consult with financial advisors.

### Compliance

**Q: Why do I need KYC?**
A: To comply with financial regulations and prevent fraud/money laundering.

**Q: How long does KYC take?**
A: Usually 1-3 business days for review and approval.

**Q: What if my KYC expires?**
A: You'll need to renew before the expiry date to continue trading.

**Q: Can I trade without KYC?**
A: No, KYC is required for all asset owners and traders.

### Fees & Costs

**Q: What fees does Continuum charge?**
A: No protocol fees! You only pay Tezos network gas fees.

**Q: How much are gas fees?**
A: Typically 0.01-0.1 XTZ per transaction (~$0.50-$5 depending on XTZ price).

**Q: Are there fees for claiming yield?**
A: Only the network gas fee. No additional protocol fees.

### Technical

**Q: What blockchain is this on?**
A: Tezos blockchain (Ghostnet for testing, Mainnet for production).

**Q: Are the smart contracts audited?**
A: Yes, contracts undergo security audits before mainnet deployment.

**Q: Can I see the contract code?**
A: Yes, all contracts are open source. Check our GitHub repository.

**Q: What if there's a bug?**
A: Contracts have emergency pause functionality. Report bugs immediately to our team.

### Support

**Q: Where can I get help?**
A: Discord, Telegram, email support, or GitHub issues.

**Q: Is there a tutorial video?**
A: Yes, check our YouTube channel for video guides.

**Q: Can I test before using real money?**
A: Yes! Use Ghostnet testnet with free test tokens.

---

## Next Steps

Now that you understand the basics:

1. **Connect your wallet** and explore the interface
2. **Complete KYC** to unlock full features
3. **Test on Ghostnet** with free tokens
4. **Create your first stream** with a small amount
5. **Join our community** on Discord/Telegram

### Useful Links

- **Application**: [https://app.continuum-protocol.com](https://app.continuum-protocol.com)
- **Documentation**: [https://docs.continuum-protocol.com](https://docs.continuum-protocol.com)
- **GitHub**: [https://github.com/continuum-protocol](https://github.com/continuum-protocol)
- **Discord**: [https://discord.gg/continuum](https://discord.gg/continuum)
- **Twitter**: [@ContinuumProtocol](https://twitter.com/ContinuumProtocol)

### Getting Help

- **Discord**: Real-time community support
- **Email**: support@continuum-protocol.com
- **GitHub Issues**: Technical problems and bugs
- **Documentation**: Comprehensive guides and API reference

---

**Welcome to the future of RWA tokenization!** 🚀

---

**Last Updated**: February 2026
**Version**: 1.0.0
