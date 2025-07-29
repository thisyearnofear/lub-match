// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LubToken.sol";

contract HeartNFT is ERC721, ERC721URIStorage, Ownable {
    struct HeartData {
        string[] imageHashes;     // IPFS hashes of the 8 images used
        uint8[] layout;          // Heart layout positions (16 slots, values 0-15)
        string message;          // Custom message from the game
        uint256 completedAt;     // Timestamp when game was completed
        address creator;         // Address that created the game
        address completer;       // Address that completed the game
        string gameType;         // "custom" or "demo"
        string metadataURI;      // IPFS URI for full metadata
    }
    
    LubToken public lubToken;
    uint256 public nextTokenId = 1;
    uint256 public mintPriceETH = 0.001 ether; // Base mint price in ETH
    
    mapping(uint256 => HeartData) public hearts;
    mapping(string => bool) public mintedGameHashes; // Prevent duplicate mints
    
    event HeartMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed completer,
        string gameType,
        uint256 pricePaid,
        bool usedLubDiscount
    );
    
    constructor(address _lubToken) ERC721("Completed Hearts", "HEART") Ownable(msg.sender) {
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
        
        // Store heart data
        hearts[tokenId] = heartData;
        mintedGameHashes[gameHash] = true;
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, heartData.metadataURI);
        
        // Refund excess payment
        if (msg.value > finalPrice) {
            payable(msg.sender).transfer(msg.value - finalPrice);
        }
        
        emit HeartMinted(tokenId, heartData.creator, heartData.completer, heartData.gameType, finalPrice, usedDiscount);
        
        return tokenId;
    }
    
    function getHeartData(uint256 tokenId) external view returns (HeartData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return hearts[tokenId];
    }
    
    function getMintPrice(bool useLubDiscount) external view returns (uint256 ethPrice, uint256 lubCost) {
        ethPrice = mintPriceETH;
        lubCost = 0;
        
        if (useLubDiscount) {
            (lubCost, ethPrice) = lubToken.getDiscountedMintPrice(mintPriceETH);
        }
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
    
    // Override required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}