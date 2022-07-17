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
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          // // If you want to do some forking, uncomment this
          // forking: {
          //   url: MAINNET_RPC_URL
          // }
          chainId: 31337,
          // blockConfirmations = 1,
      },
      rinkeby: {
            url: RINKEBY_RPC_URL,
            saveDeployments: true,
            chainId: 4,
            // blockConfirmations = 6,
            //accounts: [process.env.pk], //
            accounts: [PRIVATE_KEY],
      },
  },
  etherscan: {
      // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
      apiKey: {
          rinkeby: ETHERSCAN_API_KEY,
      },
  },
  gasReporter: {
      enabled: REPORT_GAS,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
      // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
      runOnCompile: false,
      only: ["Raffle"],
  },
  solidity: "0.8.7",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    }
  },
  mocha: {
    timeout: 200000, // 200 seconds max
  }
};
