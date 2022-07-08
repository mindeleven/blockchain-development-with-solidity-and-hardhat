const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        // contract address taken from Chainlink documentation
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ether.utils.parseEther("0.01"),
        // subscription id from https://vrf.chain.link/
        subscriptionId: "6726",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    // hardhat config doesn't need vrfCoordinatorV2 address because it takes
    // it from the mock
    31337: {
      name: "hardhat",
      entranceFee: ether.utils.parseEther("0.01"),
      // hardhat mocks the gasLane so it doesn't matter what gasLane is used
      gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    }
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
