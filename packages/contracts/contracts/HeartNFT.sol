// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LubToken.sol";

contract HeartNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    struct HeartData {
        string[] imageHashes;     // IPFS hashes of the 8 images used
        uint8[] layout;          // Heart layout positions (16 slots, values 0-15)
        string message;          // Custom message from the game
        uint256 completedAt;     // Timestamp when game was completed
        address creator;         // Address that created the game
        address completer;       // Address that completed the game
        string gameType;         // "custom" or "demo"
        string metadataURI;      // IPFS URI for full metadata
        string[] usernames;      // Farcaster usernames of featured users
        uint256[] userFollowers; // Follower counts for rarity calculation
        bool[] userVerified;     // Verified address status (more reliable than power badges)
    }

    struct CollectionStats {
        uint256 totalCustomHearts;
        uint256 totalDemoHearts;
        uint256 totalVerifiedHearts;       // Hearts with verified users
        uint256 totalHighInfluencerHearts; // >50k followers
        uint256 totalCommunityHearts;      // >10k followers
    }

    LubToken public lubToken;
    uint256 public nextTokenId = 1;
    uint256 public mintPriceETH = 0.001 ether; // Base mint price in ETH

    // Enhanced storage for better enumeration and discovery
    mapping(uint256 => HeartData) public hearts;
    mapping(string => bool) public mintedGameHashes; // Prevent duplicate mints
    mapping(address => uint256[]) public userTokens; // User's token IDs for efficient enumeration
    mapping(string => uint256[]) public gameTypeTokens; // Tokens by game type

    // Collection statistics
    CollectionStats public collectionStats;

    // Events
    event HeartMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed completer,
        string gameType,
        uint256 pricePaid,
        bool usedLubDiscount,
        uint256 totalFollowers,
        uint256 powerBadgeCount
    );

    event CollectionMilestone(
        string milestone,
        uint256 tokenId,
        uint256 totalSupply
    );

    constructor(address _lubToken) ERC721("Lub Hearts Collection", "LUBHEART") Ownable(msg.sender) {
        lubToken = LubToken(_lubToken);
    }
    
    function mintCompletedHeart(
        HeartData memory heartData,
        string memory gameHash,
        bool useLubDiscount
    ) external payable returns (uint256) {
        require(!mintedGameHashes[gameHash], "Game already minted");
        require(heartData.imageHashes.length == 8, "Must have exactly 8 images");
        require(heartData.layout.length == 16, "Layout must have 16 positions");
        require(heartData.completer == msg.sender, "Only completer can mint");
        require(heartData.usernames.length == heartData.imageHashes.length, "Username count mismatch");
        require(heartData.userFollowers.length == heartData.imageHashes.length, "Follower count mismatch");
        require(heartData.userVerified.length == heartData.imageHashes.length, "Verified status count mismatch");

        uint256 tokenId = nextTokenId++;
        uint256 finalPrice = mintPriceETH;
        bool usedDiscount = false;

        if (useLubDiscount) {
            (uint256 lubCost, uint256 discountedEthPrice) = lubToken.getDiscountedMintPrice(mintPriceETH);

            if (lubToken.balanceOf(msg.sender) >= lubCost) {
                lubToken.spendForMintDiscount(lubCost);
                finalPrice = discountedEthPrice;
                usedDiscount = true;
            }
        }

        require(msg.value >= finalPrice, "Insufficient payment");

        // Calculate collection statistics
        uint256 totalFollowers = 0;
        uint256 verifiedCount = 0;
        for (uint256 i = 0; i < heartData.userFollowers.length; i++) {
            totalFollowers += heartData.userFollowers[i];
            if (heartData.userVerified[i]) {
                verifiedCount++;
            }
        }

        // Store heart data
        hearts[tokenId] = heartData;
        mintedGameHashes[gameHash] = true;

        // Update user token tracking
        userTokens[msg.sender].push(tokenId);
        gameTypeTokens[heartData.gameType].push(tokenId);

        // Update collection statistics
        _updateCollectionStats(heartData.gameType, totalFollowers, verifiedCount);

        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, heartData.metadataURI);

        // Refund excess payment
        if (msg.value > finalPrice) {
            payable(msg.sender).transfer(msg.value - finalPrice);
        }

        // Check for milestones
        _checkMilestones(tokenId);

        emit HeartMinted(
            tokenId,
            heartData.creator,
            heartData.completer,
            heartData.gameType,
            finalPrice,
            usedDiscount,
            totalFollowers,
            verifiedCount
        );

        return tokenId;
    }

    function mintCompletedHeartWithLub(
        HeartData memory heartData,
        string memory gameHash
    ) external returns (uint256) {
        require(!mintedGameHashes[gameHash], "Game already minted");
        require(heartData.imageHashes.length == 8, "Must have exactly 8 images");
        require(heartData.layout.length == 16, "Layout must have 16 positions");
        require(heartData.completer == msg.sender, "Only completer can mint");
        require(heartData.usernames.length == heartData.imageHashes.length, "Username count mismatch");
        require(heartData.userFollowers.length == heartData.imageHashes.length, "Follower count mismatch");
        require(heartData.userVerified.length == heartData.imageHashes.length, "Verified status count mismatch");

        // Calculate full LUB cost
        uint256 exchangeRate = lubToken.getLubPerEthRate();
        uint256 lubCost = mintPriceETH * exchangeRate;

        // Burn LUB tokens for full payment
        require(lubToken.balanceOf(msg.sender) >= lubCost, "Insufficient LUB balance");
        lubToken.spendForMintDiscount(lubCost);

        uint256 tokenId = nextTokenId++;

        // Calculate collection statistics
        uint256 totalFollowers = 0;
        uint256 verifiedCount = 0;
        for (uint256 i = 0; i < heartData.userFollowers.length; i++) {
            totalFollowers += heartData.userFollowers[i];
            if (heartData.userVerified[i]) {
                verifiedCount++;
            }
        }

        // Store heart data
        hearts[tokenId] = heartData;
        mintedGameHashes[gameHash] = true;

        // Update user token tracking
        userTokens[msg.sender].push(tokenId);
        gameTypeTokens[heartData.gameType].push(tokenId);

        // Update collection statistics
        _updateCollectionStats(heartData.gameType, totalFollowers, verifiedCount);

        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, heartData.metadataURI);

        // Check for milestones
        _checkMilestones(tokenId);

        emit HeartMinted(
            tokenId,
            heartData.creator,
            heartData.completer,
            heartData.gameType,
            0, // 0 ETH paid
            true, // used discount (full LUB)
            totalFollowers,
            verifiedCount
        );

        return tokenId;
    }
    
    // Internal helper functions
    function _updateCollectionStats(string memory gameType, uint256 totalFollowers, uint256 verifiedCount) internal {
        if (keccak256(abi.encodePacked(gameType)) == keccak256(abi.encodePacked("custom"))) {
            collectionStats.totalCustomHearts++;
        } else {
            collectionStats.totalDemoHearts++;
        }

        if (verifiedCount > 0) {
            collectionStats.totalVerifiedHearts++;
        }

        uint256 avgFollowers = totalFollowers / 8; // 8 users per heart
        if (avgFollowers >= 50000) {
            collectionStats.totalHighInfluencerHearts++;
        } else if (avgFollowers >= 10000) {
            collectionStats.totalCommunityHearts++;
        }
    }

    function _checkMilestones(uint256 tokenId) internal {
        uint256 totalSupply = totalSupply();

        if (totalSupply == 100) {
            emit CollectionMilestone("First 100 Hearts", tokenId, totalSupply);
        } else if (totalSupply == 500) {
            emit CollectionMilestone("500 Hearts Milestone", tokenId, totalSupply);
        } else if (totalSupply == 1000) {
            emit CollectionMilestone("1K Hearts Collection", tokenId, totalSupply);
        } else if (totalSupply % 1000 == 0 && totalSupply > 1000) {
            emit CollectionMilestone("Major Milestone", tokenId, totalSupply);
        }
    }

    // Enhanced view functions
    function getHeartData(uint256 tokenId) external view returns (HeartData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return hearts[tokenId];
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }

    function getTokensByGameType(string memory gameType) external view returns (uint256[] memory) {
        return gameTypeTokens[gameType];
    }

    function getHeartRarity(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        HeartData memory heart = hearts[tokenId];

        uint256 totalFollowers = 0;
        uint256 verifiedCount = 0;
        for (uint256 i = 0; i < heart.userFollowers.length; i++) {
            totalFollowers += heart.userFollowers[i];
            if (heart.userVerified[i]) {
                verifiedCount++;
            }
        }

        uint256 avgFollowers = totalFollowers / heart.userFollowers.length;

        if (verifiedCount >= 6) return "Legendary Verified Heart";
        if (avgFollowers >= 100000) return "Ultra Rare Influencer Heart";
        if (avgFollowers >= 50000) return "Rare High Influencer Heart";
        if (verifiedCount >= 3) return "Rare Verified Heart";
        if (avgFollowers >= 10000) return "Uncommon Community Heart";
        return "Common Heart";
    }

    function getMintPrice(bool useLubDiscount) external view returns (uint256 ethPrice, uint256 lubCost) {
        ethPrice = mintPriceETH;
        lubCost = 0;

        if (useLubDiscount) {
            (lubCost, ethPrice) = lubToken.getDiscountedMintPrice(mintPriceETH);
        }
    }

    function getFullLubMintPrice() external view returns (uint256 lubCost) {
        // Full LUB payment: convert entire ETH price to LUB
        uint256 exchangeRate = lubToken.getLubPerEthRate();
        lubCost = mintPriceETH * exchangeRate;
    }

    function canMintGame(string memory gameHash) external view returns (bool) {
        return !mintedGameHashes[gameHash];
    }

    // Admin functions
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPriceETH = newPrice;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Required overrides for multiple inheritance
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}