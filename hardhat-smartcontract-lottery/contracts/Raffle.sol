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
error Raffle__TransferFailed();

contract Raffle is VRFConsumerBaseV2 {

    /*** state variables ***/
    // set minimum price to enter enterRaffle
    // storage variable, immutable, therefore naming with i_
    // setting a variable as immutable saves gas
    // should be setable in constructor
    uint256 private immutable i_entranceFee;
    // list of all players who entered the lottery
    // needs to be payable beacuse the player who wins will get paid
    // storage variable, therefore naming starts with s_
    address payable[] private s_players;
    // integrate VRFCoordinatorV2Interface
    VRFCoordinatorV2Interface private immutable i_vfrCoordinator;
    // from https://docs.chain.link/docs/get-a-random-number/
    // bytes32 keyHash: The gas lane key hash value, which is the maximum gas price you 
    // are willing to pay for a request in wei. It functions as an ID of the off-chain VRF job 
    // that runs in response to requests
    bytes32 private immutable i_gasLane;
    // the subscription ID that this contract uses for funding requests
    uint64 private immutable i_subscriptionId;
    // uint16 requestConfirmations: How many confirmations the Chainlink node should wait 
    // before responding. The longer the node waits, the more secure the random value is. 
    // It must be greater than the minimumRequestBlockConfirmations limit on the coordinator 
    // contract.
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    // uint32 callbackGasLimit: The limit for how much gas to use for the callback request to 
    // your contract's fulfillRandomWords() function. It must be less than the maxGasLimit 
    // limit on the coordinator contract.
    uint32 private immutable i_callbackGasLimit;
    // uint32 numWords: How many random values to request. If you can use several random 
    // values in a single callback, you can reduce the amount of gas that you spend 
    // per random value.
    uint16 private constant NUM_WORDS = 1;

    // Lottery Variables
    address private s_recentWinner;

    /*** Events ***/
    // convention: name events with the function name reversed
    event RuffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);


    constructor(
        address vrfCoordinatorV2, 
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vfrCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
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
        uint256 requestId = i_vfrCoordinator.requestRandomWords(
            i_gasLane, //keyHash
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
      uint256 /* requestId */, 
      uint256[] memory randomWords
    ) internal override {
        // override
        // fulfillRandomWords basically means fulfilling random numbers
        // to get winner we want to pick random enrty from array of winners
        // using modulo operator
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        // sending money to the recent winner
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        // require success
        if(!success){
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
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
