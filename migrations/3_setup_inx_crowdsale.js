/* global web3:true */
const INXToken = artifacts.require('INXToken');
const INXCrowdsale = artifacts.require('INXCrowdsale');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fkWxG7nrciMRrRD36yVj';
let mnemonic = require('../mnemonic');

module.exports = async function (deployer, network, accounts) {

  console.log(`Running within network = ${network}`);

  const deployedINXToken = await INXToken.deployed();
  const deployedINXCrowdsale = await INXCrowdsale.deployed();

  const _tokenInitialSupply = await deployedINXToken.initialSupply();
  const crowdsaleSupply = _tokenInitialSupply.times(0.875); // sell upto 87.5%

  await deployedINXToken.transfer(deployedINXCrowdsale.address, crowdsaleSupply);

  let _contractCreatorAccount;
  let _secondTestApprovedTestAccount;

  // Load in other accounts for different networks
  if (network === 'ropsten' || network === 'rinkeby') {
    _secondTestApprovedTestAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 1).getAddress();
    _contractCreatorAccount = accounts[0];
  } else {
    _contractCreatorAccount = accounts[0];
    _secondTestApprovedTestAccount = accounts[1];
  }

  // console.log(`_contractCreatorAccount - [${_contractCreatorAccount}]`);
  // console.log(`_secondTestApprovedTestAccount - [${_secondTestApprovedTestAccount}]`);

  // Whitelist various utility accounts
  await deployedINXCrowdsale.addManyToWhitelist([_contractCreatorAccount, _secondTestApprovedTestAccount]);

  // Whitelist the crowdsale
  await deployedINXToken.addAddressToWhitelist(deployedINXCrowdsale.address, {from: accounts[0]});
};
