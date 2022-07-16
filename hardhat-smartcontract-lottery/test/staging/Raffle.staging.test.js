const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
        let raffle, raffleEntranceFee, deployer

        beforeEach(async function(){
            const deployer = (await getNamedAccounts()).deployer
            // console.log("deployer: ", deployer)
            // get a new connection to the Raffle contract
            // connect it with deployer
            raffle = await ethers.getContract("Raffle", deployer)
            raffleEntranceFee = await raffle.getEntranceFee()
        })
    })
