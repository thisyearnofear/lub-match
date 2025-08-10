// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./LubToken.sol";

/**
 * @title PhotoPairLeaderboard
 * @dev Global leaderboard for Photo Pair Game with LUB token integration
 * @notice Implements hybrid local-to-global leaderboard system with tournaments
 */
contract PhotoPairLeaderboard is Ownable, ReentrancyGuard, Pausable {
    
    // ============================================================================
    // STRUCTS & ENUMS
    // ============================================================================
    
    struct LeaderboardEntry {
        address player;              // Player's wallet address
        string farcasterUsername;    // Farcaster username for social proof
        uint32 bestTime;            // Best completion time in seconds
        uint8 bestAccuracy;         // Best accuracy percentage (0-100)
        uint32 submissionCount;     // Total submissions made
        uint256 totalLubEarned;     // Total LUB earned from leaderboard
        Achievement[] achievements;  // Unlocked achievements
        uint256 lastSubmission;     // Timestamp of last submission
        bool isActive;              // Whether player is active
    }
    
    struct Achievement {
        string name;                // Achievement identifier
        uint256 unlockedAt;        // Timestamp when unlocked
        uint256 lubReward;         // LUB reward for this achievement
    }
    
    struct Tournament {
        uint256 id;                 // Tournament ID
        string name;               // Tournament name
        uint256 startTime;         // Start timestamp
        uint256 endTime;           // End timestamp
        uint256 entryFee;          // Entry fee in LUB
        uint256 prizePool;         // Total prize pool
        uint256 maxParticipants;   // Maximum participants
        address[] participants;     // List of participants
        bool isActive;             // Whether tournament is active
        bool prizesDistributed;    // Whether prizes have been distributed
    }
    
    struct TournamentEntry {
        address player;
        uint32 bestTime;
        uint8 bestAccuracy;
        uint256 submissionTime;
    }
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    LubToken public lubToken;
    
    // Leaderboard configuration
    uint256 public constant SUBMISSION_FEE = 10e18;        // 10 LUB per submission
    uint256 public constant ACHIEVEMENT_REWARD = 25e18;    // 25 LUB per achievement
    uint256 public constant MIN_SUBMISSION_INTERVAL = 1 hours; // Rate limiting
    
    // Achievement thresholds
    uint32 public constant SPEED_DEMON_THRESHOLD = 30;     // Under 30 seconds
    uint8 public constant PERFECT_ACCURACY_THRESHOLD = 100; // 100% accuracy
    uint32 public constant COMEBACK_TIME_THRESHOLD = 60;   // Over 60 seconds but high accuracy
    uint8 public constant COMEBACK_ACCURACY_THRESHOLD = 90; // 90%+ accuracy for comeback
    
    // Global leaderboard storage
    mapping(address => LeaderboardEntry) public leaderboard;
    address[] public allPlayers;
    mapping(address => uint256) public playerIndex; // Index in allPlayers array
    
    // Tournament system
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => TournamentEntry)) public tournamentEntries;
    mapping(uint256 => address[]) public tournamentLeaderboard; // Sorted by performance
    uint256 public nextTournamentId = 1;
    uint256 public activeTournamentId;
    
    // Achievement tracking
    mapping(string => bool) public validAchievements;
    mapping(address => mapping(string => bool)) public playerAchievements;
    
    // Statistics
    uint256 public totalSubmissions;
    uint256 public totalLubDistributed;
    uint256 public totalActivePlayers;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event ScoreSubmitted(
        address indexed player,
        string farcasterUsername,
        uint32 time,
        uint8 accuracy,
        uint256 lubFee
    );
    
    event AchievementUnlocked(
        address indexed player,
        string achievement,
        uint256 lubReward
    );
    
    event TournamentCreated(
        uint256 indexed tournamentId,
        string name,
        uint256 startTime,
        uint256 endTime,
        uint256 entryFee
    );
    
    event TournamentJoined(
        uint256 indexed tournamentId,
        address indexed player,
        uint256 entryFee
    );
    
    event TournamentEnded(
        uint256 indexed tournamentId,
        address[] winners,
        uint256[] prizes
    );
    
    event LeaderboardReset(uint256 timestamp);
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(address _lubToken) Ownable(msg.sender) {
        lubToken = LubToken(_lubToken);
        
        // Initialize valid achievements
        validAchievements["perfect"] = true;
        validAchievements["speed-demon"] = true;
        validAchievements["comeback-king"] = true;
        validAchievements["first-timer"] = true;
        validAchievements["consistent"] = true;
        validAchievements["tournament-winner"] = true;
    }
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    modifier validPlayer() {
        require(msg.sender != address(0), "Invalid player address");
        _;
    }
    
    modifier rateLimited() {
        LeaderboardEntry storage entry = leaderboard[msg.sender];
        require(
            entry.lastSubmission == 0 || 
            block.timestamp >= entry.lastSubmission + MIN_SUBMISSION_INTERVAL,
            "Submission too frequent"
        );
        _;
    }
    
    modifier activeTournamentOnly() {
        require(activeTournamentId > 0, "No active tournament");
        require(tournaments[activeTournamentId].isActive, "Tournament not active");
        require(block.timestamp >= tournaments[activeTournamentId].startTime, "Tournament not started");
        require(block.timestamp <= tournaments[activeTournamentId].endTime, "Tournament ended");
        _;
    }
    
    // ============================================================================
    // MAIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Submit score to global leaderboard
     * @param time Completion time in seconds
     * @param accuracy Accuracy percentage (0-100)
     * @param farcasterUsername Player's Farcaster username
     */
    function submitScore(
        uint32 time,
        uint8 accuracy,
        string calldata farcasterUsername
    ) external nonReentrant whenNotPaused validPlayer rateLimited {
        require(time > 0 && time <= 3600, "Invalid time"); // Max 1 hour
        require(accuracy <= 100, "Invalid accuracy");
        require(bytes(farcasterUsername).length > 0, "Username required");
        
        // Charge submission fee
        require(lubToken.balanceOf(msg.sender) >= SUBMISSION_FEE, "Insufficient LUB balance");
        lubToken.transferFrom(msg.sender, address(this), SUBMISSION_FEE);
        
        LeaderboardEntry storage entry = leaderboard[msg.sender];
        
        // Initialize new player
        if (!entry.isActive) {
            entry.player = msg.sender;
            entry.isActive = true;
            allPlayers.push(msg.sender);
            playerIndex[msg.sender] = allPlayers.length - 1;
            totalActivePlayers++;
        }
        
        // Update player data
        entry.farcasterUsername = farcasterUsername;
        entry.submissionCount++;
        entry.lastSubmission = block.timestamp;
        
        // Update personal bests
        bool newBestTime = entry.bestTime == 0 || time < entry.bestTime;
        bool newBestAccuracy = accuracy > entry.bestAccuracy;
        
        if (newBestTime) entry.bestTime = time;
        if (newBestAccuracy) entry.bestAccuracy = accuracy;
        
        // Check and award achievements
        _checkAndAwardAchievements(msg.sender, time, accuracy);
        
        // Update global statistics
        totalSubmissions++;
        
        emit ScoreSubmitted(msg.sender, farcasterUsername, time, accuracy, SUBMISSION_FEE);
    }
    
    /**
     * @dev Get player's leaderboard entry
     * @param player Player address
     * @return LeaderboardEntry struct
     */
    function getPlayerEntry(address player) external view returns (LeaderboardEntry memory) {
        return leaderboard[player];
    }
    
    /**
     * @dev Get top N players sorted by best time
     * @param limit Number of top players to return
     * @return addresses Array of player addresses
     * @return times Array of best times
     * @return accuracies Array of best accuracies
     * @return usernames Array of Farcaster usernames
     */
    function getTopPlayers(uint256 limit) external view returns (
        address[] memory addresses,
        uint32[] memory times,
        uint8[] memory accuracies,
        string[] memory usernames
    ) {
        uint256 playerCount = allPlayers.length;
        if (playerCount == 0) {
            return (new address[](0), new uint32[](0), new uint8[](0), new string[](0));
        }
        
        uint256 resultSize = limit > playerCount ? playerCount : limit;
        
        // Create arrays for sorting
        address[] memory sortedPlayers = new address[](playerCount);
        for (uint256 i = 0; i < playerCount; i++) {
            sortedPlayers[i] = allPlayers[i];
        }
        
        // Simple bubble sort by best time (ascending)
        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (_comparePerformance(sortedPlayers[j], sortedPlayers[j + 1]) > 0) {
                    address temp = sortedPlayers[j];
                    sortedPlayers[j] = sortedPlayers[j + 1];
                    sortedPlayers[j + 1] = temp;
                }
            }
        }
        
        // Prepare return arrays
        addresses = new address[](resultSize);
        times = new uint32[](resultSize);
        accuracies = new uint8[](resultSize);
        usernames = new string[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            address player = sortedPlayers[i];
            LeaderboardEntry storage entry = leaderboard[player];
            
            addresses[i] = player;
            times[i] = entry.bestTime;
            accuracies[i] = entry.bestAccuracy;
            usernames[i] = entry.farcasterUsername;
        }
        
        return (addresses, times, accuracies, usernames);
    }

    // ============================================================================
    // TOURNAMENT FUNCTIONS
    // ============================================================================

    /**
     * @dev Create a new tournament
     * @param name Tournament name
     * @param duration Duration in seconds
     * @param entryFee Entry fee in LUB
     * @param maxParticipants Maximum number of participants
     */
    function createTournament(
        string calldata name,
        uint256 duration,
        uint256 entryFee,
        uint256 maxParticipants
    ) external onlyOwner {
        require(duration > 0 && duration <= 7 days, "Invalid duration");
        require(maxParticipants > 0 && maxParticipants <= 1000, "Invalid participant limit");

        uint256 tournamentId = nextTournamentId++;
        Tournament storage tournament = tournaments[tournamentId];

        tournament.id = tournamentId;
        tournament.name = name;
        tournament.startTime = block.timestamp;
        tournament.endTime = block.timestamp + duration;
        tournament.entryFee = entryFee;
        tournament.maxParticipants = maxParticipants;
        tournament.isActive = true;
        tournament.prizesDistributed = false;

        // Set as active tournament if none exists
        if (activeTournamentId == 0) {
            activeTournamentId = tournamentId;
        }

        emit TournamentCreated(tournamentId, name, tournament.startTime, tournament.endTime, entryFee);
    }

    /**
     * @dev Join active tournament
     */
    function joinTournament() external nonReentrant whenNotPaused activeTournamentOnly {
        Tournament storage tournament = tournaments[activeTournamentId];
        require(tournament.participants.length < tournament.maxParticipants, "Tournament full");

        // Check if already joined
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            require(tournament.participants[i] != msg.sender, "Already joined");
        }

        // Charge entry fee
        if (tournament.entryFee > 0) {
            require(lubToken.balanceOf(msg.sender) >= tournament.entryFee, "Insufficient LUB balance");
            lubToken.transferFrom(msg.sender, address(this), tournament.entryFee);
            tournament.prizePool += tournament.entryFee;
        }

        tournament.participants.push(msg.sender);

        emit TournamentJoined(activeTournamentId, msg.sender, tournament.entryFee);
    }

    /**
     * @dev Submit score to active tournament
     * @param time Completion time in seconds
     * @param accuracy Accuracy percentage (0-100)
     */
    function submitTournamentScore(
        uint32 time,
        uint8 accuracy
    ) external nonReentrant whenNotPaused activeTournamentOnly {
        require(time > 0 && time <= 3600, "Invalid time");
        require(accuracy <= 100, "Invalid accuracy");

        Tournament storage tournament = tournaments[activeTournamentId];

        // Verify player is participant
        bool isParticipant = false;
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            if (tournament.participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        require(isParticipant, "Not a tournament participant");

        TournamentEntry storage entry = tournamentEntries[activeTournamentId][msg.sender];

        // Update best performance in tournament
        bool newBest = entry.bestTime == 0 ||
                      time < entry.bestTime ||
                      (time == entry.bestTime && accuracy > entry.bestAccuracy);

        if (newBest) {
            entry.player = msg.sender;
            entry.bestTime = time;
            entry.bestAccuracy = accuracy;
            entry.submissionTime = block.timestamp;
        }
    }

    /**
     * @dev End active tournament and distribute prizes
     */
    function endTournament() external onlyOwner {
        require(activeTournamentId > 0, "No active tournament");
        Tournament storage tournament = tournaments[activeTournamentId];
        require(block.timestamp > tournament.endTime, "Tournament still active");
        require(!tournament.prizesDistributed, "Prizes already distributed");

        // Sort participants by performance
        address[] memory winners = _sortTournamentParticipants(activeTournamentId);
        uint256[] memory prizes = _calculatePrizes(tournament.prizePool, winners.length);

        // Distribute prizes
        for (uint256 i = 0; i < winners.length && i < prizes.length; i++) {
            if (prizes[i] > 0) {
                lubToken.transfer(winners[i], prizes[i]);

                // Award tournament winner achievement
                if (i == 0) {
                    _awardAchievement(winners[i], "tournament-winner");
                }
            }
        }

        tournament.isActive = false;
        tournament.prizesDistributed = true;
        activeTournamentId = 0; // Clear active tournament

        emit TournamentEnded(activeTournamentId, winners, prizes);
    }

    /**
     * @dev Get tournament information
     * @param tournamentId Tournament ID
     * @return Tournament struct
     */
    function getTournament(uint256 tournamentId) external view returns (Tournament memory) {
        return tournaments[tournamentId];
    }

    /**
     * @dev Get tournament leaderboard
     * @param tournamentId Tournament ID
     * @param limit Number of top entries to return
     */
    function getTournamentLeaderboard(uint256 tournamentId, uint256 limit)
        external view returns (
            address[] memory players,
            uint32[] memory times,
            uint8[] memory accuracies
        ) {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 participantCount = tournament.participants.length;

        if (participantCount == 0) {
            return (new address[](0), new uint32[](0), new uint8[](0));
        }

        uint256 resultSize = limit > participantCount ? participantCount : limit;

        // Sort participants by performance
        address[] memory sortedParticipants = _sortTournamentParticipants(tournamentId);

        players = new address[](resultSize);
        times = new uint32[](resultSize);
        accuracies = new uint8[](resultSize);

        for (uint256 i = 0; i < resultSize; i++) {
            TournamentEntry storage entry = tournamentEntries[tournamentId][sortedParticipants[i]];
            players[i] = entry.player;
            times[i] = entry.bestTime;
            accuracies[i] = entry.bestAccuracy;
        }

        return (players, times, accuracies);
    }

    // ============================================================================
    // ACHIEVEMENT FUNCTIONS
    // ============================================================================

    /**
     * @dev Get player's achievements
     * @param player Player address
     * @return achievements Array of Achievement structs
     */
    function getPlayerAchievements(address player) external view returns (Achievement[] memory achievements) {
        return leaderboard[player].achievements;
    }

    /**
     * @dev Check if player has specific achievement
     * @param player Player address
     * @param achievementName Achievement name
     * @return bool Whether player has the achievement
     */
    function hasAchievement(address player, string calldata achievementName) external view returns (bool) {
        return playerAchievements[player][achievementName];
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @dev Check and award achievements based on performance
     * @param player Player address
     * @param time Completion time
     * @param accuracy Accuracy percentage
     */
    function _checkAndAwardAchievements(address player, uint32 time, uint8 accuracy) internal {
        LeaderboardEntry storage entry = leaderboard[player];

        // First timer achievement
        if (entry.submissionCount == 1) {
            _awardAchievement(player, "first-timer");
        }

        // Perfect accuracy achievement
        if (accuracy == PERFECT_ACCURACY_THRESHOLD) {
            _awardAchievement(player, "perfect");
        }

        // Speed demon achievement
        if (time <= SPEED_DEMON_THRESHOLD) {
            _awardAchievement(player, "speed-demon");
        }

        // Comeback king achievement (slow but accurate)
        if (time >= COMEBACK_TIME_THRESHOLD && accuracy >= COMEBACK_ACCURACY_THRESHOLD) {
            _awardAchievement(player, "comeback-king");
        }

        // Consistent player achievement (10+ submissions)
        if (entry.submissionCount >= 10) {
            _awardAchievement(player, "consistent");
        }
    }

    /**
     * @dev Award achievement to player
     * @param player Player address
     * @param achievementName Achievement name
     */
    function _awardAchievement(address player, string memory achievementName) internal {
        require(validAchievements[achievementName], "Invalid achievement");

        // Check if player already has this achievement
        if (playerAchievements[player][achievementName]) {
            return; // Already has achievement
        }

        // Mark achievement as earned
        playerAchievements[player][achievementName] = true;

        // Create achievement struct
        Achievement memory newAchievement = Achievement({
            name: achievementName,
            unlockedAt: block.timestamp,
            lubReward: ACHIEVEMENT_REWARD
        });

        // Add to player's achievements
        leaderboard[player].achievements.push(newAchievement);
        leaderboard[player].totalLubEarned += ACHIEVEMENT_REWARD;

        // Transfer LUB reward
        lubToken.transfer(player, ACHIEVEMENT_REWARD);
        totalLubDistributed += ACHIEVEMENT_REWARD;

        emit AchievementUnlocked(player, achievementName, ACHIEVEMENT_REWARD);
    }

    /**
     * @dev Compare two players' performance for sorting
     * @param playerA First player address
     * @param playerB Second player address
     * @return int256 Comparison result (-1, 0, 1)
     */
    function _comparePerformance(address playerA, address playerB) internal view returns (int256) {
        LeaderboardEntry storage entryA = leaderboard[playerA];
        LeaderboardEntry storage entryB = leaderboard[playerB];

        // Players with no submissions go to the end
        if (entryA.bestTime == 0 && entryB.bestTime == 0) return 0;
        if (entryA.bestTime == 0) return 1;
        if (entryB.bestTime == 0) return -1;

        // Primary sort: best time (ascending)
        if (entryA.bestTime < entryB.bestTime) return -1;
        if (entryA.bestTime > entryB.bestTime) return 1;

        // Secondary sort: best accuracy (descending)
        if (entryA.bestAccuracy > entryB.bestAccuracy) return -1;
        if (entryA.bestAccuracy < entryB.bestAccuracy) return 1;

        // Tertiary sort: submission count (descending)
        if (entryA.submissionCount > entryB.submissionCount) return -1;
        if (entryA.submissionCount < entryB.submissionCount) return 1;

        return 0; // Equal performance
    }

    /**
     * @dev Sort tournament participants by performance
     * @param tournamentId Tournament ID
     * @return sorted Array of sorted participant addresses
     */
    function _sortTournamentParticipants(uint256 tournamentId) internal view returns (address[] memory sorted) {
        Tournament storage tournament = tournaments[tournamentId];
        uint256 participantCount = tournament.participants.length;

        sorted = new address[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            sorted[i] = tournament.participants[i];
        }

        // Bubble sort by tournament performance
        for (uint256 i = 0; i < participantCount - 1; i++) {
            for (uint256 j = 0; j < participantCount - i - 1; j++) {
                if (_compareTournamentPerformance(tournamentId, sorted[j], sorted[j + 1]) > 0) {
                    address temp = sorted[j];
                    sorted[j] = sorted[j + 1];
                    sorted[j + 1] = temp;
                }
            }
        }

        return sorted;
    }

    /**
     * @dev Compare tournament performance between two players
     * @param tournamentId Tournament ID
     * @param playerA First player
     * @param playerB Second player
     * @return int256 Comparison result
     */
    function _compareTournamentPerformance(
        uint256 tournamentId,
        address playerA,
        address playerB
    ) internal view returns (int256) {
        TournamentEntry storage entryA = tournamentEntries[tournamentId][playerA];
        TournamentEntry storage entryB = tournamentEntries[tournamentId][playerB];

        // Players with no submissions go to the end
        if (entryA.bestTime == 0 && entryB.bestTime == 0) return 0;
        if (entryA.bestTime == 0) return 1;
        if (entryB.bestTime == 0) return -1;

        // Primary sort: best time (ascending)
        if (entryA.bestTime < entryB.bestTime) return -1;
        if (entryA.bestTime > entryB.bestTime) return 1;

        // Secondary sort: best accuracy (descending)
        if (entryA.bestAccuracy > entryB.bestAccuracy) return -1;
        if (entryA.bestAccuracy < entryB.bestAccuracy) return 1;

        // Tertiary sort: submission time (earlier is better)
        if (entryA.submissionTime < entryB.submissionTime) return -1;
        if (entryA.submissionTime > entryB.submissionTime) return 1;

        return 0;
    }

    /**
     * @dev Calculate prize distribution for tournament
     * @param prizePool Total prize pool
     * @param participantCount Number of participants
     * @return prizes Array of prize amounts
     */
    function _calculatePrizes(uint256 prizePool, uint256 participantCount) internal pure returns (uint256[] memory prizes) {
        if (prizePool == 0 || participantCount == 0) {
            return new uint256[](0);
        }

        uint256 prizeCount = participantCount > 10 ? 10 : participantCount; // Top 10 get prizes
        prizes = new uint256[](prizeCount);

        if (prizeCount == 1) {
            prizes[0] = prizePool;
        } else if (prizeCount == 2) {
            prizes[0] = (prizePool * 70) / 100; // 70% to 1st
            prizes[1] = (prizePool * 30) / 100; // 30% to 2nd
        } else if (prizeCount >= 3) {
            prizes[0] = (prizePool * 50) / 100; // 50% to 1st
            prizes[1] = (prizePool * 30) / 100; // 30% to 2nd
            prizes[2] = (prizePool * 20) / 100; // 20% to 3rd

            // Distribute remaining to 4th-10th place
            if (prizeCount > 3) {
                uint256 remaining = prizePool - prizes[0] - prizes[1] - prizes[2];
                uint256 perPlayer = remaining / (prizeCount - 3);
                for (uint256 i = 3; i < prizeCount; i++) {
                    prizes[i] = perPlayer;
                }
            }
        }

        return prizes;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @dev Reset the entire leaderboard (emergency function)
     */
    function resetLeaderboard() external onlyOwner {
        // Clear all player data
        for (uint256 i = 0; i < allPlayers.length; i++) {
            address player = allPlayers[i];
            delete leaderboard[player];
            delete playerIndex[player];

            // Clear achievement mappings
            string[6] memory achievementNames = ["perfect", "speed-demon", "comeback-king", "first-timer", "consistent", "tournament-winner"];
            for (uint256 j = 0; j < achievementNames.length; j++) {
                delete playerAchievements[player][achievementNames[j]];
            }
        }

        // Clear arrays
        delete allPlayers;

        // Reset statistics
        totalSubmissions = 0;
        totalActivePlayers = 0;

        emit LeaderboardReset(block.timestamp);
    }

    /**
     * @dev Add new valid achievement type
     * @param achievementName Achievement name
     */
    function addAchievementType(string calldata achievementName) external onlyOwner {
        validAchievements[achievementName] = true;
    }

    /**
     * @dev Remove achievement type
     * @param achievementName Achievement name
     */
    function removeAchievementType(string calldata achievementName) external onlyOwner {
        validAchievements[achievementName] = false;
    }

    /**
     * @dev Withdraw accumulated LUB tokens (from submission fees)
     * @param amount Amount to withdraw
     */
    function withdrawLub(uint256 amount) external onlyOwner {
        require(amount <= lubToken.balanceOf(address(this)), "Insufficient balance");
        lubToken.transfer(owner(), amount);
    }

    /**
     * @dev Emergency pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Update LUB token address (emergency function)
     * @param newLubToken New LUB token address
     */
    function updateLubToken(address newLubToken) external onlyOwner {
        require(newLubToken != address(0), "Invalid token address");
        lubToken = LubToken(newLubToken);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @dev Get global leaderboard statistics
     * @return totalPlayers Total number of players
     * @return totalSubs Total submissions
     * @return totalDistributed Total LUB distributed
     * @return activePlayers Number of active players
     */
    function getGlobalStats() external view returns (
        uint256 totalPlayers,
        uint256 totalSubs,
        uint256 totalDistributed,
        uint256 activePlayers
    ) {
        return (allPlayers.length, totalSubmissions, totalLubDistributed, totalActivePlayers);
    }

    /**
     * @dev Get player's rank in global leaderboard
     * @param player Player address
     * @return rank Player's rank (1-based, 0 if not found)
     */
    function getPlayerRank(address player) external view returns (uint256 rank) {
        if (!leaderboard[player].isActive) return 0;

        uint256 betterPlayers = 0;
        for (uint256 i = 0; i < allPlayers.length; i++) {
            address otherPlayer = allPlayers[i];
            if (otherPlayer != player && _comparePerformance(otherPlayer, player) < 0) {
                betterPlayers++;
            }
        }

        return betterPlayers + 1;
    }

    /**
     * @dev Check if contract is ready for submissions
     * @return bool Whether submissions are allowed
     */
    function isSubmissionAllowed() external view returns (bool) {
        return !paused() && address(lubToken) != address(0);
    }

    /**
     * @dev Get contract version
     * @return string Version identifier
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
