// source code and comments taken from
// https://hardhat.org/tutorial/testing-contracts
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to owner", async function() {
    // Signer in ethers.js is an object that represents an Ethereum account
    const [owner] = await ethers.getSigners();

    // ContractFactory is an abstraction used to deploy new smart contracts
    // Token is a factory for instances of the token contract
    const Token = await ethers.getContractFactory("Token");

    // Calling deploy() on a ContractFactory will start the deployment
    // and return a Promise that resolves to a Contract
    const hardhatToken = await Token.deploy();

    // contract methods can be called on hardhatToken
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    // checking if token's supply amount is equal to ownerBalance
    // this is done with assertions library Chai
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  })
});
