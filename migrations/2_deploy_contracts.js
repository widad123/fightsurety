const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0x8d71f4859257D798Eb1Dfde2051a3c2906F3CAaA';
    deployer.deploy(FlightSuretyData,firstAirline)
    .then(() => {
        let contractAddress=FlightSuretyData.address;
        return deployer.deploy(FlightSuretyApp,contractAddress)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address,
                            gas: deployer.networks[deployer.network].gas

                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}