const { getNamedAccounts, deployments, network, ethers } = require("hardhat")

const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium in LINK
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // const chainId = network.config.chainId
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        // deploy a mock vrf coordinator
        // https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args
        })
        log("Mocks Deployed!")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
