
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it("(airline) regester five airlines using registerAirline",async ()=>{
    let airlineOne = accounts[3];
    let airlineTwo = accounts[4];
    let airlineThree = accounts[5];
    let airlineFour = accounts[6];
    let price = new BigNumber(10);

    

    try{
        await config.flightSuretyApp.registerAirline(airlineOne,0, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airlineTwo,0, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airlineThree,0, {from: config.firstAirline});

        assert.equal(await config.flightSuretyData.isAirline.call(airlineOne), true, "airlineOne registred");
        assert.equal(await config.flightSuretyData.isAirline.call(airlineTwo), true, "airlineTwo registred");
        assert.equal(await config.flightSuretyData.isAirline.call(airlineThree), true, "airlineThree registred");

        assert.equal(await config.flightSuretyData.setVote.call(config.firstAirline),true, "firstAirlinevoted");
        assert.equal(await config.flightSuretyData.setVote.call(airlineTwo),true, "airlineTwo voted");

       // await config.flightSuretyApp.registerAirline(airlineFour, price,{from: config.firstAirline});
       await config.flightSuretyApp.registerAirline(airlineFour,price, {from:airlineTwo,gas: 1500000});
        assert.equal(await config.flightSuretyData.isAirline.call(airlineFour), true, "airlineFour registred");


    }catch(e){
        console.log(e);
    }
    




  })


});
