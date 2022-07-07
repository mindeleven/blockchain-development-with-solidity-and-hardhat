// code adjustments according to
// https://github.com/PatrickAlphaC/hardhat-smartcontract-lottery-fcc/blob/main/hardhat.config.js
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
// const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          // // If you want to do some forking, uncomment this
          // forking: {
          //   url: MAINNET_RPC_URL
          // }
          chainId: 31337,
          blockConfirmations = 1,
      },
      rinkeby: {
            url: RINKEBY_RPC_URL,
            saveDeployments: true,
            chainId: 4,
            blockConfirmations = 6,
            accounts: [process.env.pk], // accounts: [PRIVATE_KEY]
      },
  },
  solidity: "0.8.7",
  getNamedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    }
  }
};
