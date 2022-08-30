pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;    // Blocks all state changes throughout the contract if false
    
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
    mapping(address=>Airline) public airlines;
    mapping(bytes32=>Passenger) private passengers;
    mapping(address=>uint256) private insureesBalance;
    mapping(address=>bool) private authorizedContracts;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

   /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address airlineAddress
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        Airline memory airline1 =Airline(0,true,false);
    airlines[airlineAddress]=airline1;
    count ++;
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
        require(airlines[airlineAddress].isRegistered==false,"Airline has already registred!");
        _;
    }

     modifier requireAuthorizedCaller() {
        require(authorizedContracts[msg.sender],"Caller is not autorized");
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
    
      function authorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    function deauthorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    function getCount() external view returns(uint256){
        return count;
    }

    function isVoted(address addr) external view returns (bool){
        return airlines[addr].voted;
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

    function setAirline(address addr,uint256 amount) external returns(bool) {
        airlines[addr]=Airline(amount,true,false);
        return true;
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
                            requireContractOwner
                            requireIsOperational
                            requireAirlineRegistred(airlineAddress)
                            returns(bool success)
    {
    Airline memory airline1 =Airline(0,true,false);
    airlines[airlineAddress]=airline1;
    count ++;
    return true;
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
                                view
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
                            bytes32 flightKey
                            )
                            external
                            payable
    {
    require(msg.sender!=address(0),"address must be valid");
    require(passengers[flightKey].passengerAddress==msg.sender,"the address is not valid");
    require(insureesBalance[msg.sender]>0,"The amount is not sufficent");
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
                            )
                            public
                            payable
                            requireIsOperational
    {
        require(airlines[msg.sender].isRegistered,"Airline not registred!");
        require(msg.value>=10 ether,"The amount is not sufficient");
         uint256 amount =airlines[msg.sender].fund;
         airlines[msg.sender].fund=amount.add(msg.value);
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

