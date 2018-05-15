pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/utils/RefundVault.sol";

contract INXCrowdsale is Crowdsale, Pausable {

  event Finalized();

  mapping(address => bool) public whitelist;

  mapping(address => uint256) public contributions;

  bool public isFinalized = false;

  // FIXME arbitrarily set to one minute until until we know when to open
  uint256 public openingTime = now.add(1 minutes);

  uint256 public closingTime = openingTime.add(30 days);

  uint256 public goal = 5000 ether;

  uint256 public min = 0.2 ether;

  uint256 public max = 1000 ether;

  // refund vault used to hold funds while crowdsale is running
  RefundVault public vault;

  function INXCrowdsale(address _wallet, StandardToken _token) public Crowdsale(1, _wallet, _token) {
    vault = new RefundVault(wallet);
  }

  /**
   * @dev Investors can claim refunds here if crowdsale is unsuccessful
   */
  function claimRefund() public {
    require(isFinalized);
    require(!goalReached());

    vault.refund(msg.sender);
  }

  /**
   * @dev Checks whether funding goal was reached.
   * @return Whether funding goal was reached
   */
  function goalReached() public view returns (bool) {
    return weiRaised >= goal;
  }

  /**
   * @dev vault finalization task, called when owner calls finalize()
   */
  function finalization() internal {
    if (goalReached()) {
      vault.close();
    } else {
      vault.enableRefunds();
    }
  }

  /**
   * @dev Overrides Crowdsale fund forwarding, sending funds to vault.
   */
  function _forwardFunds() internal {
    vault.deposit.value(msg.value)(msg.sender);
  }

  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization
   * work. Calls the contract's finalization function.
   */
  function finalize() onlyOwner public {
    require(!isFinalized);
    require(hasClosed());

    finalization();
    Finalized();

    isFinalized = true;
  }

  /**
   * @dev Adds single address to whitelist.
   * @param _beneficiary Address to be added to the whitelist
   */
  function addToWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = true;
  }

  /**
   * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing.
   * @param _beneficiaries Addresses to be added to the whitelist
   */
  function addManyToWhitelist(address[] _beneficiaries) external onlyOwner {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      whitelist[_beneficiaries[i]] = true;
    }
  }

  /**
   * @dev Removes single address from whitelist.
   * @param _beneficiary Address to be removed to the whitelist
   */
  function removeFromWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = false;
  }

  /**
   * @dev Extend parent behavior to update user contributions so far
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    super._updatePurchasingState(_beneficiary, _weiAmount);
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already elapsed.
   * @return Whether crowdsale period has elapsed
   */
  function hasClosed() public view returns (bool) {
    return now > closingTime;
  }

  /**
   * @dev gets current time
   * @return the current blocktime
   */
  function getNow() public view returns (uint) {
    return now;
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has elapsed.
   * @return Whether crowdsale period is open
   */
  function isCrowdsaleOpen() public view returns (bool) {
    return now >= openingTime && now <= closingTime;
  }

  /**
  * @dev Extend parent behavior requiring contract to not be paused.
  * @param _beneficiary Token beneficiary
  * @param _weiAmount Amount of wei contributed
  */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);

    require(now >= openingTime && now <= closingTime);

    require(_weiAmount >= min);

    require(contributions[_beneficiary].add(_weiAmount) <= max);

    require(whitelist[_beneficiary]);

    require(!paused);
  }
}
