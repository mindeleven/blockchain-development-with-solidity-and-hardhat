const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        // contract address taken from Chainlink documentation
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ethers.utils.parseEther("0.01"),
        // subscription id from https://vrf.chain.link/
        subscriptionId: "6726",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        callbackGasLimit: "500000", // 500,000 gas
        interval: "30"
    },
    // hardhat config doesn't need vrfCoordinatorV2 address because it takes
    // it from the mock
    31337: {
      name: "hardhat",
      entranceFee: ethers.utils.parseEther("0.01"),
      // hardhat mocks the gasLane so it doesn't matter what gasLane is used
      gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
      callbackGasLimit: "500000", // 500,000 gas
      interval: "30"
    }
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6


module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
