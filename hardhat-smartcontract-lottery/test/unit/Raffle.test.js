const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
        let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, interval, deployer

        beforeEach(async function(){
            const deployer = (await getNamedAccounts()).deployer
            // console.log("deployer: ", deployer)
            // deploys modules with the tags "mocks", "raffle" and "all"
            await deployments.fixture(["all"])
            // get a new connection to the Raffle contract
            // connect it with deployer
            raffle = await ethers.getContract("Raffle", deployer)
            // get a new connection to the VRFCoordinatorV2Mock contract
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            raffleEntranceFee = await raffle.getEntranceFee()
        })

        describe("constructor", async function () {
            it("intitiallizes the raffle correctly", async () => {
                // Ideally, we'd separate these out so that only 1 assert per "it" block
                // And ideally, we'd make this check everything
                const raffleState = (await raffle.getRaffleState()).toString()
                const interval = await raffle.getInterval()
                // Comparisons for Raffle initialization:
                assert.equal(raffleState, "0")
                assert.equal(
                    interval.toString(),
                    networkConfig[network.config.chainId]["interval"]
                )
            })
        })

        describe("enterRaffle", function () {
            it("reverts when you don't pay enough", async () => {
                await expect(raffle.enterRaffle()).to.be.revertedWith(
                    // is reverted when not paid enough or raffle is not open
                    "Raffle__NotEnoughETHEntered"
                )
            })

            it("records player when they enter", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                const playerFromContract = await raffle.getPlayer(0)
                // console.log(playerFromContract)
                assert.equal(deployer, playerFromContract.address)
            })
        })
    })
