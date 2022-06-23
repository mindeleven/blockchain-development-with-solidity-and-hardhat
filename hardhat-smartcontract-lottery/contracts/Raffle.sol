// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Raffle contract TODOs
// (1) Enter the lottery by paying some amount
// (2) Pick a random winner (verifiable random)
// (2) Winner to be selected completely automated every X minutes

// What needs to be created outside of the contract:
// (1) random number -> Chainlink Oracle, Randomness
// (2) automated execution -> Chainlink Keepers

// subscription for Chainlink Verifiable Randomness Function
// at https://vrf.chain.link/ (log in to MetaMask first)

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

error Raffle__NotEnoughETHEntered();

contract Raffle is VRFConsumerBaseV2 {

    /*** state variables ***/
    // set minimum price to enter enterRaffle
    // storage variable, immutable, therefore naming with i_
    // setting a variable as immutable saves gas
    // should be setable in constructor
    uint256 private immutable i_entranceFee;

    /*** Events ***/
    // convention: name events with the function name reversed
    event RuffleEnter(address indexed player);

    // list of all players who entered the lottery
    // needs to be payable beacuse the player who wins will get paid
    // storage variable, therefore naming starts with s_
    address payable[] private s_players;

    constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
    }

    // (1) Enter the lottery by paying some amount
    function enterRaffle() public payable {
        // require msg.value > i_entranceFee
        // using custom error instead of require string to safe gas
        // see https://blog.soliditylang.org/2021/04/21/custom-errors/
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        // msg.sender isn't a payable address
        // so it needs to be typecasted to a payable address
        s_players.push(payable(msg.sender));

        // when a dynamic array or mapping is updated
        // we always want to emit an event
        // mamed events with the function name reversed
        emit RuffleEnter(msg.sender);
    }

    // (2) Pick a random winner (verifiable random)
    // is run by the chainlink keepers network
    // external functions are cheaper than public functions
    function requestRandomWinner() external {
        // (1) request the random number
        // (2) do something with the random number
        // it's a two transaction process that has the advantage
        // of preventing brute force attacks from manipulating the lottery
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory rendowWords) internal override {
        // override
        // fulfillRandomWords basically means fulfilling random numbers
    }

    /* View / Pure functions */
    // all users should be able to see the entrance fee
    function getEntranceFee() public view returns(uint256) {
        return i_entranceFee;
    }

    // get a certain player
    function getPlayer(uint256 index) public view returns(address) {
        return s_players[index];
    }
}
