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
            interval = await raffle.getInterval()
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

            // see https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
            // "Emitting events" section
            it("emits event on enter", async () => {
                // emits RaffleEnter event if entered to index player(s) address
                await expect(raffle.enterRaffle({
                    value: raffleEntranceFee
                })).to.emit(
                    raffle,
                    "RaffleEnter"
                )
            })

            it("doesn't allow entrance when raffle is calculating", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                // for a documentation of the methods below,
                // go here: https://hardhat.org/hardhat-network/reference
                // https://hardhat.org/hardhat-network/docs/reference#hardhat-network-methods

                // we increase time of blockchain and mine a block to move forward
                // evm_increaseTime allows us to increase the time of our blockchain
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                // evm_mine allows us to create new blocks
                await network.provider.request({ method: "evm_mine", params: [] })

                // we pretend to be a keeper for a second
                // changes the state to calculating for our comparison below
                await raffle.performUpkeep([])
                await expect(raffle.enterRaffle({
                    value: raffleEntranceFee
                })).to.be.revertedWith( // is reverted as raffle is calculating
                    "Raffle__NotOpen"
                )
            })
        })

        describe("checkUpkeep", function () {
            it("returns false if people haven't sent any ETH", async () => {
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                // callStatic simulates sending a transaction
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                assert(!upkeepNeeded)
            })

            it("returns false if raffle isn't open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                // change the state to calculate
                await raffle.performUpkeep([])
                // store the new state
                const raffleState = await raffle.getRaffleState()
                // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                // const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                // assert.equal(raffleState.toString() == "1", upkeepNeeded == false)
                assert.equal(raffleState.toString(), "1")
                assert.equal(upkeepNeeded, false)
            })

            it("returns false if enough time hasn't passed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })

            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded)
            })
        })

    })
