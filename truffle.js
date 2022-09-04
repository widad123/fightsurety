var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "toddler pink wait abuse magic soccer squeeze pupil announce moon expand spot";


module.exports = {
  networks: {
    development: {
      //provider: function() {
    //  return  new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/",0,50);
      //},
      host: "127.0.0.1",     // Localhost
      port: 8545,
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