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

        describe("constructor", function () {
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

        describe("performUpkeep", function () {
            it("can only run if checkupkeep is true", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const tx = await raffle.performUpkeep("0x")
                assert(tx)
            })

            it("reverts if checkup is false", async () => {
                await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                    "Raffle__UpkeepNotNeeded"
                )
            })

            it("updates the raffle state, emits an event, and calls the vrf coordinator", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const txResponse = await raffle.performUpkeep("0x") // emits requestId
                const txReceipt = await txResponse.wait(1) // waits 1 block
                const requestId = txReceipt.events[1].args.requestId
                const raffleState = await raffle.getRaffleState() // updates state
                assert(requestId.toNumber() > 0)
                assert(raffleState.toString() == "1") // 0 = open, 1 = calculating
            })
        })

        describe("fulfillRandomWords", function () {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
            })

            it("can only be called after performupkeep", async () => {
                await expect(
                    // revert if not fulfilled
                    vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                ).to.be.revertedWith("nonexistent request")
                await expect(
                    // revert if not fulfilled
                    vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                ).to.be.revertedWith("nonexistent request")
            })

            // this is going to be a test that's way to big
            it("picks a winner, resets, and sends money", async () => {
                // adding additional people who enter the lottery
                const additionalEntrances = 3
                const startingAccountIndex = 1 // deployer = 0
                const accounts = await ethers.getSigners()
                // connect raffle contract to new accounts
                for (
                    let i = startingAccountIndex;
                    i < startingAccountIndex + additionalEntrances;
                    i++
                ) { // i = 2; i < 5; i=i+1
                    const accountConnectedRaffle = raffle.connect(accounts[i]) // Returns a new instance of the Raffle contract connected to player
                    await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                }

                // store starting timestamp (before we fire our event)
                const startingTimeStamp = await raffle.getLastTimeStamp()

                // performUpkeep (mock being Chainlink Keepers)
                // fulfillRandomWords (mock being the Chainlink VRF)
                // we will have to wait for the fulFillRandomWords to be called
                await new Promise(async (resolve, reject) => {
                    // listen for the WinnerPicked event
                    // setting listener before event gets fired
                    raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
                          // console.log once the event gets fired
                          // see below when fired
                          console.log("WinnerPicked event fired!")
                          try {
                              // checking if everything in the raffle is set correctly
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              // const winnerBalance = await accounts[2].getBalance()
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              // assert that players array has been set to 0
                              const numPlayers = await raffle.getNumberOfPlayers()
                              winnerEndingBalance = await accounts[1].getBalance()
                              assert.equal(numPlayers.toString(), "0")
                              // assert that the raffle state has been set back to open
                              assert.equal(raffleState.toString(), "0")
                              // make sure last timestamp has been updated
                              assert(endingTimeStamp > startingTimeStamp)

                              // make sure that the winner got paid
                              // winner should end up with balance that everybody else paid to this contract
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                  // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee)
                                      )
                                      .toString()
                              )
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                    })
                    // mocha.timeout in hardhat.config
                    // if event won't get fired within 200 seconds it will time out

                    // below we will fire the event,
                    // and the listener will pick it up,
                    // and resolve
                    const tx = await raffle.performUpkeep("0x")
                    const txReceipt = await tx.wait(1)
                    const winnerStartingBalance = await accounts[1].getBalance()
                    // once this function gets called it should emit a WinnerPicked event
                    // this is the event that the raffle above is listening for
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        raffle.address
                    )

                })

            })

        })

    })
