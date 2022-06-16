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

describe("Transactions", function() {
  it("Should transfer tokens between accounts", async function() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");

    const hardhatToken = await Token.deploy();

    // transfer 50 tokens from owner to addr1
    // contract is depolyed be owner 
    // owner is sender of transfer
    await hardhatToken.transfer(addr1.address, 50);
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(50);

    // switching between accounts and transfering 50 tokens from addr1 to addr2
    await hardhatToken.connect(addr1).transfer(addr2.address, 50);
    expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
  });
});
