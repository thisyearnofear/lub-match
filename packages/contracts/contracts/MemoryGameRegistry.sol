// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract MemoryGameRegistry {
    event GamePublished(
        address indexed creator,
        string cid,
        string message,
        uint256 timestamp
    );

    function publishGame(string calldata cid, string calldata message) external {
        emit GamePublished(msg.sender, cid, message, block.timestamp);
    }
}