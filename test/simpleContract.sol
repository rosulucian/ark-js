pragma solidity ^0.4.19;

contract SimpleStorage {
    uint storedData;

    function SimpleStorage() public {
      storedData = 1;
    }

    function set(uint x) public {
        storedData = x;
    }

    function get() constant public returns (uint) {
        return storedData;
    }
}
