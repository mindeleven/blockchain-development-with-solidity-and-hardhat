// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Raffle contract TODOs
// (1) Enter the lottery by paying some amount
// (2) Pick a random winner (verifiable random)
// (2) Winner to be selected completely automated every X minutes

// What needs to be created outside of the contract:
// (1) random number -> Chainlink Oracle, Randomness
// (2) automated execution -> Chainlink Keepers

error Raffle__NotEnoughETHEntered();

contract Raffle {

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

    constructor(uint256 entranceFee) {
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
    //function pickRandomWinner() {}

    // all users should be able to see the entrance fee
    function getEntranceFee() public view returns(uint256) {
        return i_entranceFee;
    }

    // get a certain player
    function getPlayer(uint256 index) public view returns(address) {
        return s_players[index];
    }
}
