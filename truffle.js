var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "library festival float month gap wave mom extend rich drink tortoise dismiss";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/",0,50);
      },
      network_id: '*',
      //gas: 9999999
      gas:4000000
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};