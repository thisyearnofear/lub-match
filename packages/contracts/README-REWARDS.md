# 💰 LUB Token Event-Based Reward System

## Overview

This system automatically distributes LUB token rewards based on on-chain events from your deployed contracts. It scans the blockchain weekly for user activities and distributes rewards accordingly.

## 🎯 How It Works

### 1. **Event Tracking**

The system monitors these on-chain events:

| Event                 | Contract             | Reward | Description                              |
| --------------------- | -------------------- | ------ | ---------------------------------------- |
| `HeartMinted`         | HeartNFT             | 25 LUB | User mints an NFT                        |
| `GameCreated`         | LubToken             | 10 LUB | User creates a game (bonus for spending) |
| `ScoreSubmitted`      | PhotoPairLeaderboard | 15 LUB | User submits leaderboard score           |
| `AchievementUnlocked` | PhotoPairLeaderboard | 50 LUB | User unlocks achievement                 |
| `TournamentJoined`    | PhotoPairLeaderboard | 30 LUB | User joins tournament                    |
| `GamePublished`       | MemoryGameRegistry   | 20 LUB | User publishes a game                    |

### 2. **Weekly Distribution Process**

```bash
# Sunday 23:00 UTC - Scan events from past week
npm run scan-events

# Monday 09:00 UTC - Distribute rewards to users
npm run distribute-rewards

# Or run both together
npm run weekly-rewards
```

## 🚀 Quick Start

### Prerequisites

```bash
cd packages/contracts
npm install
```

### Test the System

```bash
# Test connectivity and recent events
npm run test-events
```

### Run Weekly Distribution

```bash
# Scan last week's events
npm run scan-events

# Distribute rewards (review the generated file first!)
npm run distribute-rewards
```

## 📁 File Structure

```
packages/contracts/
├── scripts/
│   ├── scanWeeklyEvents.ts      # Scans blockchain for events
│   ├── distributeWeeklyRewards.ts # Distributes LUB tokens
│   ├── testEventSystem.ts       # Tests system connectivity
│   └── sendLub.ts              # Manual token sending
├── config/
│   └── rewardConfig.ts         # Reward amounts and settings
├── distributions/              # Generated distribution files
│   ├── weekly-distribution-YYYY-MM-DD.json
│   └── distribution-results-YYYY-MM-DD.json
└── README-REWARDS.md          # This file
```

## ⚙️ Configuration

### **Block Scanning Limits**

- **Default scan range**: 100 blocks (RPC-friendly)
- **Full week would be**: ~2.4M blocks (7 days × 4 blocks/second)
- **RPC limitation**: Most providers limit to 100-500 blocks per query
- **Automatic fallback**: Reduces to 50 blocks if RPC errors occur

### **Reward Configuration**

Edit reward amounts and settings in the script files:

- **Reward amounts** per event type
- **Contract addresses** when new contracts are deployed
- **Block scan limits** for RPC compatibility
- **Distribution timing** and gas settings

## 📊 Distribution Files

### Scan Output (`weekly-distribution-YYYY-MM-DD.json`)

```json
{
  "scanPeriod": {
    "fromBlock": 12345,
    "toBlock": 67890,
    "fromDate": "2025-01-06T00:00:00.000Z",
    "toDate": "2025-01-13T00:00:00.000Z"
  },
  "totalUsers": 25,
  "totalRewards": "1250.0",
  "recipients": [
    {
      "address": "0x...",
      "amount": "75.0",
      "eventCount": 3,
      "events": [...]
    }
  ]
}
```

### Distribution Results (`distribution-results-YYYY-MM-DD.json`)

```json
{
  "distributionId": "2025-01-13",
  "totalRecipients": 25,
  "totalAmountDistributed": "1250.0",
  "successfulTransfers": 25,
  "failedTransfers": 0,
  "results": [...]
}
```

## 🔒 Security Features

- **Event validation**: Only rewards legitimate on-chain events
- **Address validation**: Ensures valid Ethereum addresses
- **Balance checks**: Verifies sufficient LUB before distribution
- **Transfer verification**: Confirms each transfer succeeded
- **Duplicate prevention**: Won't double-reward the same events

## 💡 Benefits

### ✅ **No Database Required**

- Blockchain is the database
- Events are permanent and verifiable
- No server infrastructure needed

### ✅ **Fraud Resistant**

- Can't fake on-chain events
- All rewards are transparent
- Verifiable on blockchain explorers

### ✅ **Scalable**

- Works with unlimited users
- Batch processing for efficiency
- Gas-optimized transfers

### ✅ **Future Proof**

- Easy to add new contracts
- Configurable reward amounts
- Extensible event types

## 🛠️ Troubleshooting

### No Events Found

```bash
# Check if contracts are deployed and active
npm run test-events
```

### RPC Block Range Errors

The system automatically handles RPC limitations:

- **Default**: Scans 100 blocks (safe for most RPC providers)
- **Auto-fallback**: Reduces to 50 blocks if errors occur
- **Warning shown**: When scanning less than full week

**To scan more history:**

1. Use a premium RPC provider with higher limits
2. Run multiple scans with different date ranges
3. Consider upgrading to a dedicated Arbitrum node

### Insufficient Balance

```bash
# Check deployer LUB balance
npm run check-balance
```

### Failed Transfers

- Check the `distribution-results-*.json` file for error details
- Ensure recipients have valid addresses
- Verify network connectivity

## 📈 Analytics

The system tracks:

- **Total rewards distributed** per week
- **Event breakdown** by type
- **User participation** metrics
- **Gas costs** for optimization

## 🔄 Automation Options

### Option 1: Manual (Current)

Run scripts manually each week

### Option 2: Cron Job

```bash
# Add to crontab for automated weekly distribution
0 23 * * 0 cd /path/to/contracts && npm run scan-events
0 9 * * 1 cd /path/to/contracts && npm run distribute-rewards
```

### Option 3: GitHub Actions

Set up automated workflows for scheduled distribution

## 🎯 Next Steps

1. **Test the system**: `npm run test-events`
2. **Run first scan**: `npm run scan-events`
3. **Review distribution file** in `distributions/` folder
4. **Distribute rewards**: `npm run distribute-rewards`
5. **Set up automation** for weekly runs

## 📞 Support

For issues or questions:

1. Check the console output for error details
2. Review the generated JSON files
3. Verify contract addresses in config
4. Test with `npm run test-events`

---

**🎉 Your event-based reward system is ready to incentivize on-chain activity!**
