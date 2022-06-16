require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.3",
  networks: {
    hardhat: {
      // Chain ID of MetaMask Localhost 8545 configuration
      // run 'ganache-cli --port 8545 --chainId 5777' first
      chainId: 5777 // 1337
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9719668b397f4a14928a14b0dd205cd7",
      accounts: [process.env.pk]
    },
  }
};
