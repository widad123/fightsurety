
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

        assert.equal(await config.flightSuretyData.setVote.call(config.firstAirline),true, "firstAirline voted");
        assert.equal(await config.flightSuretyData.setVote.call(airlineTwo),true, "airlineTwo voted");

       await config.flightSuretyApp.registerAirline(airlineFour,price, {from:airlineTwo,gas: 1500000});
        assert.equal(await config.flightSuretyData.isAirline.call(airlineFour), true, "airlineFour registred");


    }catch(e){
        console.log(e);
    }
  });

  it("register a flight",async()=>{
    let airline =accounts[7];

    try {
        let result = await config.flightSuretyApp.registerFlight(airline,"flightTest");
        const event=  await result.logs[0].args;
        let key =event.flightKey;
        let result2 =await config.flightSuretyApp.flights.call(key);
        assert.equal( event.isRegistered,true,"flight registered");
        assert.equal( event.airline,result2.airline,"aireline is correct");
        //console.log(result2);
        assert.equal( event.timestamp.toString(),result2.updatedTimestamp.toString(),"Timestamp is correct");
    } catch (error) {
        console.log(error);
    }

  });
  it("buy work",async()=>{
    let airline =accounts[8];
    let price=new BigNumber(2);

    try {
        let result = await config.flightSuretyApp.registerFlight(airline,"flightTest2");
        const event=  await result.logs[0].args;
        let flightKey =event.flightKey;
        let result2 = await config.flightSuretyData.buy(flightKey,{value:price});
        const event2=await result2.logs[0].args;
        let passengers= await config.flightSuretyData.passengers.call(flightKey);
        assert.equal( event2.passengerAddress,passengers.passengerAddress,"Address is registered");
        assert.equal( event2.passengerBalance.toString(),passengers.passengerBalance.toString(),"Balance is correct");
        let passengerCount=await config.flightSuretyData.getPassengerCount.call();
        assert.equal( event2.countPassenger.toString(),passengerCount.toString(),"PassengerCount is correct");
    } catch (error) {
        console.log(error);
    }
    

  });
   
    it('creditInsurees work',async()=>{
    let airline =accounts[9];
    let price=new BigNumber(2);
    let balanceExpected=new BigNumber(3);

    let result = await config.flightSuretyApp.registerFlight(airline,"flightTest3");
    const event=  await result.logs[0].args;
    let flightKey =event.flightKey;

    await config.flightSuretyData.buy(flightKey,{value:price});
    let passengers1= await config.flightSuretyData.passengers.call(flightKey);
    assert.equal(passengers1.passengerBalance.toString(),price.toString(),"Balance passenger before credit insures is correct");
     await config.flightSuretyData.creditInsurees(flightKey);
     let passengers2= await config.flightSuretyData.passengers.call(flightKey);
     assert.equal(passengers2.passengerBalance.toString(),balanceExpected.toString(),"Balance passenger after credit insures is correct");
    });


  it("pay work",async()=>{
    let airline =accounts[10];
    let price=new BigNumber(2);

    let result = await config.flightSuretyApp.registerFlight(airline,"flightTest4");
    const event=  await result.logs[0].args;
    let flightKey =event.flightKey;

    await config.flightSuretyData.buy(flightKey,{value:price});
    await config.flightSuretyData.creditInsurees(flightKey);
    let passengers1= await config.flightSuretyData.passengers.call(flightKey);
    assert.equal(passengers1.passengerBalance.toString(),"3","Balance passenger before pay is correct");
    await config.flightSuretyData.pay(flightKey);
    let passengers2= await config.flightSuretyData.passengers.call(flightKey);
    assert.equal(passengers2.passengerBalance.toString(),"0","Balance passenger after pay is correct");


   // let passengers1= await config.flightSuretyData.passengers.call(flightKey);
     //assert.equal(passengers2.passengerBalance.toString(),balanceExpected.toString(),"Balance passenger after credit insures is correct");
    


  });


});
