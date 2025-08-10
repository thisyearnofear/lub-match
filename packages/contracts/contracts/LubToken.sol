// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LubToken is ERC20, Ownable {
    // Game creation economics
    uint256 public gameCreationCost = 100e18; // 100 LUB base cost
    uint256 public constant COST_INCREASE_BPS = 1000; // 10% increase per game
    uint256 public constant INCLUSION_REWARD = 10e18; // 10 LUB per inclusion
    uint256 public totalGamesCreated;
    
    // Minting economics
    uint256 public constant MINT_DISCOUNT_BPS = 5000; // 50% discount with LUB
    uint256 public constant LUB_PER_ETH = 1000; // 1000 LUB = 1 ETH exchange rate
    
    // Authorized contracts
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedSpenders;
    
    event GameCreated(address indexed creator, uint256 costPaid);
    event InclusionReward(address indexed user, uint256 amount);
    event MintDiscount(address indexed user, uint256 lubSpent, uint256 ethSaved);
    
    constructor() ERC20("Lub Token", "LUB") Ownable(msg.sender) {
        // Mint initial supply for testing and rewards
        _mint(msg.sender, 1000000e18); // 1M LUB
    }
    
    function spendForGameCreation() external {
        uint256 currentCost = getCurrentGameCreationCost();
        require(balanceOf(msg.sender) >= currentCost, "Insufficient LUB balance");
        
        _burn(msg.sender, currentCost);
        totalGamesCreated++;
        
        emit GameCreated(msg.sender, currentCost);
    }
    
    function rewardInclusion(address[] memory includedUsers) external {
        require(authorizedMinters[msg.sender], "Not authorized to mint rewards");
        
        for (uint256 i = 0; i < includedUsers.length; i++) {
            if (includedUsers[i] != address(0)) {
                _mint(includedUsers[i], INCLUSION_REWARD);
                emit InclusionReward(includedUsers[i], INCLUSION_REWARD);
            }
        }
    }
    
    function getCurrentGameCreationCost() public view returns (uint256) {
        // Cost increases by 10% for each game created
        uint256 multiplier = 10000; // 100% in basis points
        for (uint256 i = 0; i < totalGamesCreated; i++) {
            multiplier = (multiplier * (10000 + COST_INCREASE_BPS)) / 10000;
        }
        return (gameCreationCost * multiplier) / 10000;
    }
    
    function getDiscountedMintPrice(uint256 ethPrice) external view returns (uint256 lubCost, uint256 discountedEthPrice) {
        // Calculate ETH discount amount (50% of original price)
        uint256 ethDiscount = (ethPrice * MINT_DISCOUNT_BPS) / 10000;

        // Convert ETH discount to LUB cost using exchange rate
        lubCost = ethDiscount * LUB_PER_ETH;

        // Final discounted ETH price
        discountedEthPrice = ethPrice - ethDiscount;
    }
    
    function spendForMintDiscount(address user, uint256 lubAmount) external {
        require(authorizedSpenders[msg.sender], "Not authorized to spend for discounts");
        require(balanceOf(user) >= lubAmount, "Insufficient LUB balance");

        _burn(user, lubAmount);
        uint256 ethValue = lubAmount / LUB_PER_ETH; // Calculate ETH value of burned LUB
        emit MintDiscount(user, lubAmount, ethValue);
    }

    function getLubPerEthRate() external pure returns (uint256) {
        return LUB_PER_ETH;
    }
    
    // Admin functions
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }
    
    function setAuthorizedSpender(address spender, bool authorized) external onlyOwner {
        authorizedSpenders[spender] = authorized;
    }
    
    function airdrop(address[] memory recipients, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }
}