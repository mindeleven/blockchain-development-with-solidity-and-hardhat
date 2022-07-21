// see https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/729
// for issue with hh test --network rinkeby

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

        describe("fulfillRandomWords", function () {
              console.log("fulfillRandomWords...")

              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner",
                  async function () {
                  // enter the raffle
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()
                  console.log('accounts[0]:' + accounts[0].address)
                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {

                      // we want to set up a listener before we enter the raffle
                      // just in case the blockchain moves really fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("Winner picked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              console.log('endingTimeStamp..... ' + endingTimeStamp)
                              console.log('startingTimeStamp..... ' + startingTimeStamp)

                              await expect(raffle.getPlayer(0)).to.be.reverted

                              assert.equal(recentWinner.toString(), accounts[0].address)
                              //assert.equal(raffleState, 0)
                              assert.equal(raffleState.toString(), "0")

                              console.log('winnerStartingBalance..... ' + winnerStartingBalance.toString())
                              console.log('winnerEndingBalance..... ' + winnerEndingBalance.toString())
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              // assert(endingTimeStamp > startingTimeStamp)
                              expect(parseInt(endingTimeStamp)).to.be.greaterThan(parseInt(startingTimeStamp));

                              resolve()

                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })

                      console.log("Entering Raffle...");
                      // if timeout occurs after entering ruffle make sure
                      // upkeep is not underfunded 
                      // https://keepers.chain.link/rinkeby/2779
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      // if winner is picked to quickly after the raffle gets entered
                      // starting time equals ending time
                      // increase the wait time here for more block confirmations
                      // compare https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/348
                      await tx.wait(3);
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                      // and this code won't complete until our listener hash
                      // finished listening
                  })
              })
        })
    })
