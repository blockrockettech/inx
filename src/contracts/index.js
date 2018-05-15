/* global web3:true */

import contract from 'truffle-contract';

// import artifacts
import inxToken from '../../build/contracts/INXToken.json';
import inxCrowdsale from '../../build/contracts/INXCrowdsale.json';

// create contracts
const INXToken = contract(inxToken);
INXToken.setProvider(web3.currentProvider);

const INXCrowdsale = contract(inxCrowdsale);
INXCrowdsale.setProvider(web3.currentProvider);

export {
  INXToken,
  INXCrowdsale
};
