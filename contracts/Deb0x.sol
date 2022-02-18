// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

contract Deb0x {

    mapping (address => string) private encryptionKeys;

    mapping (address => mapping(address => string[])) private messages;

    function setKey(string memory encryptionKey) public {
        encryptionKeys[msg.sender] = encryptionKey;
    }

    function getKey(address account) public view returns (string memory) {
        return encryptionKeys[account];
    }

    function send(address to, string memory payload) public {
        messages[to][msg.sender].push(payload);
    }

    function fetchMessages(address to, address from) public view returns (string[] memory) {
        return messages[to][from];
    }
}
