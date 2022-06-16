// source code and comments taken from
// https://hardhat.org/tutorial/testing-contracts
const { ethers } = require("hardhat");
// importing Chai to use asserting functions
const { expect } = require("chai");

// putting all tests in one describe function for means of organization
describe("Token contract", function () {

  //  declare variables that are assigned in
  // `before` and `beforeEach` callbacks
  let Token;
  let hardhatToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // beforeEach runs before each test
  // redeploying the contract every time
  beforeEach(async function () {

    // ContractFactory is an abstraction used to deploy new smart contracts
    // Token is a factory for instances of the token contract
    Token = await ethers.getContractFactory("Token");
    // get the signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Calling deploy() on a ContractFactory will start the deployment
    // and return a Promise that resolves to a Contract
    // which happens once its transaction has been mined
    hardhatToken = await Token.deploy();
  });

  // nest describe calls to create subsections
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // expect receives a value and wraps it in an assertion object
      // test expects the owner variable stored in the contract
      // to be equal to the signer
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Deployment should assign the total supply of tokens to owner", async function() {
      // contract methods can be called on hardhatToken
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      // checking if token's supply amount is equal to ownerBalance
      // this is done with assertions library Chai
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function() {
    it("Should transfer tokens between accounts", async function() {
      // transfer 50 tokens from owner to addr1
      // contract is depolyed be owner
      // owner is sender of transfer
      await hardhatToken.transfer(addr1.address, 50);
      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // switching between accounts and transfering 50 tokens from addr1 to addr2
      await hardhatToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens)
      // `require` will evaluate false and revert the transaction
      await expect(
        hardhatToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough tokens");

      // Owner balance shouldn't have changed
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      await hardhatToken.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2
      await hardhatToken.transfer(addr2.address, 50);

      // Check balances
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

  });
});
