pragma solidity ^0.4.19;

contract ReallySimple {
    uint storedData;

    function ReallySimple() public {
      storedData = 2;
    }

    function Add(uint x) public {
      storedData = storedData + x;
    }
}
