pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;    // Blocks all state changes throughout the contract if false
    
    mapping(address=>Airline) private airlines;
    uint256 private count = 0;
    
    struct Airline{
        uint256 fund;
        bool isRegistered;
        bool voted;
    }  

    struct Passenger
    {
        address passengerAddress;
        //bytes32 flightKey;
        uint256 passengerBalance;
    }
    uint256 private countPassenger;
    mapping(bytes32=>address) private passengers;
    mapping(address=>uint256) private insureesBalance;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

   /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                 address airelineAddress
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        this.registerAirline(airelineAddress);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAirlineRegistred(address airlineAddress)
    {
        require(airlines[airlineAddress].isRegistered!=true,"Airline has already registred!");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

 function isAirlineRegistred (address addr) public view returns (bool)
    {
        return airlines[addr].isRegistered;
    }
    
    
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address airlineAddress
                            )
                            external
                            view
                            requireContractOwner
                            requireIsOperational
                            requireAirlineRegistred(airlineAddress)
    {
    Airline memory airline1 =Airline(0,true,false);
    airlines[airlineAddress]=airline1;
    count ++;
    }
   

   /**
    * @dev Buy insurance for a flight
    */   
    function buy
                            (
                                bytes32 flightKey 
                            )
                            external
                            payable
                            requireIsOperational
    {
        require(msg.value>=1,"The amount is not sufficent");
        require(msg.sender!=address(0),"address must be valid");
        Passenger memory passenger=Passenger(msg.sender,msg.value);
        passengers[flightKey]=passenger;
        countPassenger++;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                bytes32 flightKey 
                                )
                                external
                                pure
    {
        for (uint256 i = 0; i <= countPassenger; i++) {
        uint256 amount=(passengers[flightKey].passengerBalance).mul(3).div(2);
                insureesBalance [passengers[flightKey].passengerAddress].add(amount);
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
      struct Passenger
    {
        address passengerAddress;
        //bytes32 flightKey;
        uint256 passengerBalance;
    }
    uint256 private countPassenger;
    mapping(bytes32=>address) private passengers;
    mapping(address=>uint256) private insureesBalance;
     *
    */
    function pay
                            (
                            address flightKey
                            )
                            external
                            pure
    {
    require(msg.sender!=address(0),"address must be valid");
    require(insureesBalance [passengers[flightKey].passengerAddress]==msg.sender,"the address is not valid");
    require(insureesBalance [passengers[flightKey].passengerAddress]>0,"The amount is not sufficent");
     uint256 amount = insureesBalance[msg.sender];
     insureesBalance[msg.sender]=0;
     msg.sender.transfer(amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            ( 
                               address airlineAddress,
                               uint256 _amount  
                            )
                            public
                            payable
                            requireIsOperational
    {
        require(airlines[airlineAddress].isRegistered,"Airline not registred!");
        require(_amount>=10 ether,"The amount is not sufficient");
         uint256 amount =airlines[airlineAddress].fund;
         airlines[airlineAddress].fund=amount.add(_amount);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

