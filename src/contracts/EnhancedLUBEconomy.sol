// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LUBToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EnhancedLUBEconomy
 * @dev Manages enhanced token economy features including daily rewards,
 * marketplace purchases, social incentives, and gamification mechanics.
 */
contract EnhancedLUBEconomy is ReentrancyGuard, Ownable, Pausable {
    LUBToken public lubToken;
    
    // Reward tracking
    mapping(address => uint256) public dailyRewardsClaimed;
    mapping(address => uint256) public lastRewardClaim;
    mapping(address => uint256) public loginStreaks;
    mapping(address => uint256) public lastLoginDate;
    
    // User progression
    mapping(address => uint256) public userXP;
    mapping(address => uint256) public userLevel;
    mapping(address => uint256) public socialScore;
    mapping(address => mapping(string => bool)) public achievements;
    
    // Game statistics
    mapping(address => uint256) public gamesPlayed;
    mapping(address => uint256) public perfectGames;
    mapping(address => uint256) public speedBonuses;
    mapping(address => uint256) public socialShares;
    
    // Marketplace items
    struct MarketplaceItem {
        string id;
        string name;
        uint256 price;
        bool active;
        uint256 requirementLevel;
        uint256 requirementSocial;
        string requirementAchievement;
    }
    
    mapping(string => MarketplaceItem) public marketplaceItems;
    mapping(address => mapping(string => bool)) public ownedItems;
    mapping(address => mapping(string => uint256)) public itemPurchaseTime;
    
    // Events
    event DailyRewardClaimed(address indexed user, uint256 amount, uint256 streak);
    event GameRewardEarned(address indexed user, uint256 amount, string rewardType);
    event AchievementUnlocked(address indexed user, string achievementId, uint256 reward);
    event MarketplaceItemPurchased(address indexed user, string itemId, uint256 price);
    event SocialRewardEarned(address indexed user, uint256 amount, string shareType);
    event LevelUp(address indexed user, uint256 newLevel);
    
    // Constants
    uint256 public constant BASE_DAILY_REWARD = 5 * 10**18; // 5 LUB
    uint256 public constant PERFECT_GAME_BONUS = 25 * 10**18; // 25 LUB
    uint256 public constant SPEED_BONUS = 15 * 10**18; // 15 LUB
    uint256 public constant FIRST_GAME_BONUS = 10 * 10**18; // 10 LUB
    uint256 public constant SOCIAL_SHARE_BASE = 20 * 10**18; // 20 LUB
    uint256 public constant REFERRAL_BONUS = 50 * 10**18; // 50 LUB
    
    // XP amounts
    uint256 public constant BASE_GAME_XP = 50;
    uint256 public constant PERFECT_GAME_XP = 25;
    uint256 public constant SPEED_BONUS_XP = 15;
    uint256 public constant FIRST_GAME_XP = 20;
    uint256 public constant SOCIAL_SHARE_XP = 30;
    uint256 public constant REFERRAL_XP = 100;
    
    constructor(address _lubToken) {
        lubToken = LUBToken(_lubToken);
        
        // Initialize some marketplace items
        _addMarketplaceItem("theme-sunset", "Sunset Theme", 50 * 10**18, 0, 0, "");
        _addMarketplaceItem("theme-neon", "Neon Glow Theme", 150 * 10**18, 5, 0, "");
        _addMarketplaceItem("hint-pack-small", "Hint Pack (3x)", 30 * 10**18, 0, 0, "");
        _addMarketplaceItem("double-xp-1hour", "Double XP (1 Hour)", 120 * 10**18, 0, 0, "");
        _addMarketplaceItem("leaderboard-spotlight", "Leaderboard Spotlight", 500 * 10**18, 0, 100, "");
        _addMarketplaceItem("nft-rare-chance", "Rare NFT Chance Boost", 400 * 10**18, 10, 0, "");
        _addMarketplaceItem("nft-custom-trait", "Custom NFT Trait", 800 * 10**18, 15, 0, "nft-collector-10");
    }
    
    modifier onlyOncePerDay() {
        require(
            block.timestamp >= lastRewardClaim[msg.sender] + 1 days,
            "Daily reward already claimed"
        );
        _;
    }
    
    /**
     * @dev Claim daily login reward with streak multiplier
     */
    function claimDailyReward() external nonReentrant onlyOncePerDay whenNotPaused {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 lastLoginDay = lastLoginDate[msg.sender];
        
        uint256 streak;
        if (lastLoginDay == currentDay - 1) {
            // Consecutive day login
            streak = loginStreaks[msg.sender] + 1;
        } else {
            // First login or streak broken
            streak = 1;
        }
        
        loginStreaks[msg.sender] = streak;
        lastLoginDate[msg.sender] = currentDay;
        lastRewardClaim[msg.sender] = block.timestamp;
        
        // Calculate reward with streak multiplier
        uint256 reward = BASE_DAILY_REWARD;
        if (streak >= 30) {
            reward = reward * 3; // 3x for 30+ day streak
        } else if (streak >= 7) {
            reward = reward * 2; // 2x for 7+ day streak
        } else if (streak >= 3) {
            reward = (reward * 3) / 2; // 1.5x for 3+ day streak
        }
        
        dailyRewardsClaimed[msg.sender] += reward;
        lubToken.mint(msg.sender, reward);
        
        emit DailyRewardClaimed(msg.sender, reward, streak);
    }
    
    /**
     * @dev Record game completion and award rewards
     */
    function recordGameCompletion(
        uint256 completionTime,
        uint256 accuracy,
        bool isFirstToday
    ) external nonReentrant whenNotPaused {
        gamesPlayed[msg.sender]++;
        
        uint256 totalReward = 0;
        uint256 totalXP = BASE_GAME_XP;
        
        // First game of day bonus
        if (isFirstToday) {
            totalReward += FIRST_GAME_BONUS;
            totalXP += FIRST_GAME_XP;
            emit GameRewardEarned(msg.sender, FIRST_GAME_BONUS, "first-game");
        }
        
        // Perfect accuracy bonus
        if (accuracy >= 100) {
            totalReward += PERFECT_GAME_BONUS;
            totalXP += PERFECT_GAME_XP;
            perfectGames[msg.sender]++;
            emit GameRewardEarned(msg.sender, PERFECT_GAME_BONUS, "perfect-game");
        }
        
        // Speed bonus (under 30 seconds)
        if (completionTime <= 30) {
            totalReward += SPEED_BONUS;
            totalXP += SPEED_BONUS_XP;
            speedBonuses[msg.sender]++;
            emit GameRewardEarned(msg.sender, SPEED_BONUS, "speed-bonus");
        }
        
        // Award tokens and XP
        if (totalReward > 0) {
            lubToken.mint(msg.sender, totalReward);
        }
        
        _awardXP(msg.sender, totalXP);
        _checkAchievements(msg.sender);
    }
    
    /**
     * @dev Record social sharing and award rewards
     */
    function recordSocialShare(
        string memory shareType,
        uint256 viralityScore
    ) external nonReentrant whenNotPaused {
        socialShares[msg.sender]++;
        socialScore[msg.sender] = _min(socialScore[msg.sender] + 2, 100);
        
        // Calculate reward with virality bonus
        uint256 baseReward = SOCIAL_SHARE_BASE;
        uint256 viralBonus = _min(viralityScore * 10, 200); // Max 2x multiplier (200% = 2x)
        uint256 reward = (baseReward * (100 + viralBonus)) / 100;
        
        lubToken.mint(msg.sender, reward);
        _awardXP(msg.sender, SOCIAL_SHARE_XP);
        
        emit SocialRewardEarned(msg.sender, reward, shareType);
        _checkAchievements(msg.sender);
    }
    
    /**
     * @dev Record friend referral and award bonus
     */
    function recordReferral(address referrer, address referred) external onlyOwner {
        require(referrer != referred, "Cannot refer yourself");
        
        // Award referrer
        lubToken.mint(referrer, REFERRAL_BONUS);
        _awardXP(referrer, REFERRAL_XP);
        socialScore[referrer] = _min(socialScore[referrer] + 5, 100);
        
        emit SocialRewardEarned(referrer, REFERRAL_BONUS, "referral");
        _checkAchievements(referrer);
    }
    
    /**
     * @dev Purchase marketplace item
     */
    function purchaseMarketplaceItem(string memory itemId) external nonReentrant whenNotPaused {
        MarketplaceItem memory item = marketplaceItems[itemId];
        require(item.active, "Item not available");
        require(!ownedItems[msg.sender][itemId], "Item already owned");
        
        // Check requirements
        require(userLevel[msg.sender] >= item.requirementLevel, "Level requirement not met");
        require(socialScore[msg.sender] >= item.requirementSocial, "Social score requirement not met");
        
        if (bytes(item.requirementAchievement).length > 0) {
            require(achievements[msg.sender][item.requirementAchievement], "Achievement requirement not met");
        }
        
        // Transfer tokens
        lubToken.transferFrom(msg.sender, address(this), item.price);
        
        // Mark as owned
        ownedItems[msg.sender][itemId] = true;
        itemPurchaseTime[msg.sender][itemId] = block.timestamp;
        
        emit MarketplaceItemPurchased(msg.sender, itemId, item.price);
    }
    
    /**
     * @dev Award XP and check for level ups
     */
    function _awardXP(address user, uint256 amount) internal {
        userXP[user] += amount;
        
        // Calculate level from XP
        uint256 newLevel = _calculateLevel(userXP[user]);
        if (newLevel > userLevel[user]) {
            userLevel[user] = newLevel;
            emit LevelUp(user, newLevel);
        }
    }
    
    /**
     * @dev Calculate level from total XP
     */
    function _calculateLevel(uint256 totalXP) internal pure returns (uint256) {
        if (totalXP == 0) return 1;
        
        uint256 level = 1;
        uint256 xpForLevel = 500; // Starting XP requirement
        uint256 accumulatedXP = 0;
        
        while (totalXP >= accumulatedXP + xpForLevel) {
            accumulatedXP += xpForLevel;
            level++;
            
            // Increase XP requirement every 5 levels
            if (level % 5 == 0) {
                xpForLevel = (xpForLevel * 3) / 2; // 1.5x multiplier
            }
        }
        
        return level;
    }
    
    /**
     * @dev Check and unlock achievements
     */
    function _checkAchievements(address user) internal {
        // First Steps - Complete first game
        if (gamesPlayed[user] == 1 && !achievements[user]["first-steps"]) {
            _unlockAchievement(user, "first-steps", 10 * 10**18);
        }
        
        // Memory Novice - Complete 10 games
        if (gamesPlayed[user] == 10 && !achievements[user]["memory-novice"]) {
            _unlockAchievement(user, "memory-novice", 50 * 10**18);
        }
        
        // Perfect Streak - 5 perfect games (simplified check)
        if (perfectGames[user] >= 5 && !achievements[user]["perfect-streak-5"]) {
            _unlockAchievement(user, "perfect-streak-5", 100 * 10**18);
        }
        
        // Speed Demon - 10 speed bonuses
        if (speedBonuses[user] >= 10 && !achievements[user]["speed-demon-10"]) {
            _unlockAchievement(user, "speed-demon-10", 200 * 10**18);
        }
        
        // Memory Master - 100 games
        if (gamesPlayed[user] >= 100 && !achievements[user]["memory-master-100"]) {
            _unlockAchievement(user, "memory-master-100", 500 * 10**18);
        }
        
        // Social Butterfly - 10 social shares
        if (socialShares[user] >= 10 && !achievements[user]["social-butterfly"]) {
            _unlockAchievement(user, "social-butterfly", 150 * 10**18);
        }
    }
    
    /**
     * @dev Unlock achievement and award rewards
     */
    function _unlockAchievement(address user, string memory achievementId, uint256 reward) internal {
        achievements[user][achievementId] = true;
        lubToken.mint(user, reward);
        emit AchievementUnlocked(user, achievementId, reward);
    }
    
    /**
     * @dev Add marketplace item (owner only)
     */
    function _addMarketplaceItem(
        string memory id,
        string memory name,
        uint256 price,
        uint256 levelReq,
        uint256 socialReq,
        string memory achievementReq
    ) internal {
        marketplaceItems[id] = MarketplaceItem({
            id: id,
            name: name,
            price: price,
            active: true,
            requirementLevel: levelReq,
            requirementSocial: socialReq,
            requirementAchievement: achievementReq
        });
    }
    
    /**
     * @dev Add new marketplace item (owner only)
     */
    function addMarketplaceItem(
        string memory id,
        string memory name,
        uint256 price,
        uint256 levelReq,
        uint256 socialReq,
        string memory achievementReq
    ) external onlyOwner {
        _addMarketplaceItem(id, name, price, levelReq, socialReq, achievementReq);
    }
    
    /**
     * @dev Update marketplace item (owner only)
     */
    function updateMarketplaceItem(
        string memory id,
        uint256 price,
        bool active
    ) external onlyOwner {
        marketplaceItems[id].price = price;
        marketplaceItems[id].active = active;
    }
    
    /**
     * @dev Withdraw accumulated tokens (owner only)
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        lubToken.transfer(owner(), amount);
    }
    
    /**
     * @dev Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getUserStats(address user) external view returns (
        uint256 level,
        uint256 xp,
        uint256 streak,
        uint256 games,
        uint256 social,
        uint256 dailyClaimed
    ) {
        return (
            userLevel[user],
            userXP[user],
            loginStreaks[user],
            gamesPlayed[user],
            socialScore[user],
            dailyRewardsClaimed[user]
        );
    }
    
    function getMarketplaceItem(string memory id) external view returns (
        string memory name,
        uint256 price,
        bool active,
        uint256 levelReq,
        uint256 socialReq,
        string memory achievementReq
    ) {
        MarketplaceItem memory item = marketplaceItems[id];
        return (
            item.name,
            item.price,
            item.active,
            item.requirementLevel,
            item.requirementSocial,
            item.requirementAchievement
        );
    }
    
    function hasAchievement(address user, string memory achievementId) external view returns (bool) {
        return achievements[user][achievementId];
    }
    
    function ownsItem(address user, string memory itemId) external view returns (bool) {
        return ownedItems[user][itemId];
    }
    
    function canClaimDailyReward(address user) external view returns (bool) {
        return block.timestamp >= lastRewardClaim[user] + 1 days;
    }
    
    function calculateDailyReward(address user) external view returns (uint256) {
        uint256 streak = loginStreaks[user];
        
        // Check if consecutive login
        uint256 currentDay = block.timestamp / 1 days;
        uint256 lastLoginDay = lastLoginDate[user];
        if (lastLoginDay != currentDay - 1) {
            streak = 1; // Streak would reset
        } else {
            streak += 1; // Streak would increase
        }
        
        uint256 reward = BASE_DAILY_REWARD;
        if (streak >= 30) {
            reward = reward * 3;
        } else if (streak >= 7) {
            reward = reward * 2;
        } else if (streak >= 3) {
            reward = (reward * 3) / 2;
        }
        
        return reward;
    }
    
    // Helper functions
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
