pragma solidity ^0.4.19;


import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Whitelist.sol';


contract INXToken is StandardToken, Whitelist {

  string public constant name = "INX Token";

  string public constant symbol = "INX";

  uint8 public constant decimals = 18;

  uint256 public constant initialSupply = 28000000 * (10 ** uint256(decimals)); // 25 Million INX to 18 decimal places

  uint256 public constant unlockTime = now.add(30 days);

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function INXToken() public Whitelist() {
    totalSupply_ = initialSupply;
    balances[msg.sender] = initialSupply;
    Transfer(0x0, msg.sender, initialSupply);

    // owner is automatically whitelisted
    addAddressToWhitelist(msg.sender);
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    // lock transfers until after ICO completes unless whitelisted
    require(now > unlockTime || whitelist[msg.sender]);

    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    // lock transfers until after ICO completes unless whitelisted
    require(now > unlockTime || whitelist[msg.sender]);

    return super.transferFrom(_from, _to, _value);
  }
}
