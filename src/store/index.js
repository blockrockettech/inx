/* global web3:true */

import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutation-types';
import createLogger from 'vuex/dist/logger';
import { getNetIdString } from '../utils';

import { INXCrowdsale, INXToken } from '../contracts/index';

const _token = INXToken;
const _crowdsale = INXCrowdsale;

const utils = require('../utils');

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createLogger()],
  state: {
    // connectivity
    account: null,
    currentNetwork: null,

    // token metadata
    tokenAddress: '',
    token: '',
    tokenName: '',
    tokenSymbol: '',
    tokenBalance: 0,
    tokenTotalSupply: 0,

    // crowdsale
    address: null,
    rate: 0,
    wallet: null,
    start: 0,
    end: 0,
    owner: null,
    min: 0,
    max: 0,
    vault: null,

    //crowdsale dynamic
    raised: 0,
    crowdsaleBalance: 0,
    contributions: 0,
    paused: null,

    // refund vault
    vaultBalance: 0,
    vaultState: null,
    whitelisted: null,
    kycWaitingList: []
  },
  getters: {
    isOwner: (state) => (state.owner && state.account) ? state.owner.toLowerCase() === state.account.toLowerCase() : false,
    inKycWaitingList: (state) => (state.kycWaitingList) ? state.kycWaitingList.includes(state.account) : false
  },
  mutations: {
    [mutations.SET_STATIC_CROWDSALE_DETAILS](state, {
      rate,
      token,
      wallet,
      start,
      end,
      address,
      owner,
      min,
      max,
      vault
    }) {
      state.rate = rate;
      state.token = token;
      state.wallet = wallet;
      state.start = start;
      state.end = end;
      state.address = address;
      state.owner = owner;
      state.min = min;
      state.max = max;
      state.vault = vault;
    },
    [mutations.SET_CROWDSALE_DETAILS](state, {
      raised,
      whitelisted,
      contributions,
      paused
    }) {
      state.raised = raised;
      state.whitelisted = whitelisted;
      state.contributions = contributions;
      state.paused = paused;
    },
    [mutations.SET_VAULT_BALANCE](state, vaultBalance) {
      state.vaultBalance = vaultBalance;

    },
    [mutations.SET_STATIC_CONTRACT_DETAILS](state, {name, symbol, totalSupply, address}) {
      state.tokenTotalSupply = totalSupply;
      state.tokenSymbol = symbol;
      state.tokenName = name;
      state.tokenAddress = address;
    },
    [mutations.SET_CONTRACT_DETAILS](state, {tokenBalance, crowdsaleBalance}) {
      state.tokenBalance = tokenBalance;
      state.crowdsaleBalance = crowdsaleBalance;
    },
    [mutations.SET_ACCOUNT](state, account) {
      state.account = account;
    },
    [mutations.SET_CURRENT_NETWORK](state, currentNetwork) {
      state.currentNetwork = currentNetwork;
    },
    [mutations.PUSH_TO_KYC_WAITING_LIST](state, kycAccount) {
      state.kycWaitingList.push(kycAccount);
      Vue.set(state, 'kycWaitingList', state.kycWaitingList);
    },
    [mutations.REMOVE_FROM_KYC_WAITING_LIST](state, kycAccount) {
      state.kycWaitingList = state.kycWaitingList.filter(e => e !== kycAccount);
      Vue.set(state, 'kycWaitingList', state.kycWaitingList);
    }
  },
  actions: {
    [actions.GET_CURRENT_NETWORK]({commit, dispatch, state}) {
      getNetIdString()
      .then((currentNetwork) => {
        commit(mutations.SET_CURRENT_NETWORK, currentNetwork);
      });
    },
    [actions.INIT_APP]({commit, dispatch, state}) {
      // use Web3?
      web3.eth.getAccounts()
      .then((accounts) => {

        // store the account
        commit(mutations.SET_ACCOUNT, accounts[0]);

        store.dispatch(actions.INIT_CONTRACT_DETAILS, accounts[0]);
        store.dispatch(actions.INIT_CROWDSALE_DETAILS, accounts[0]);
        return accounts;
      });
    },
    [actions.REFRESH_APP]({commit, dispatch, state}) {
      // use Web3?
      web3.eth.getAccounts()
      .then((accounts) => {

        // store the account
        commit(mutations.SET_ACCOUNT, accounts[0]);

        store.dispatch(actions.REFRESH_CONTRACT_DETAILS, accounts[0]);
        store.dispatch(actions.REFRESH_CROWDSALE_DETAILS, accounts[0]);
        store.dispatch(actions.VAULT_BALANCE);
        return accounts;
      });
    },
    [actions.INIT_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      _token.deployed()
      .then((contract) => {
        return Promise.all([
          contract.name(),
          contract.symbol(),
          contract.totalSupply({from: account}),
          contract.address
        ]);
      })
      .then((results) => {
        commit(mutations.SET_STATIC_CONTRACT_DETAILS, {
          name: results[0],
          symbol: results[1],
          totalSupply: results[2].toString(10),
          address: results[3]
        });
      });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}, account) {
      _token.deployed()
      .then((contract) => {
        return Promise.all([
          contract.balanceOf(account, {from: account}),
          contract.balanceOf(state.address, {from: account})
        ]);
      })
      .then((results) => {
        commit(mutations.SET_CONTRACT_DETAILS, {
          tokenBalance: results[0],
          crowdsaleBalance: results[1]
        });
      });
    },
    [actions.INIT_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      _crowdsale.deployed()
      .then((contract) => {
        return Promise.all([
          contract.rate(),
          contract.token(),
          contract.wallet(),
          contract.openingTime(),
          contract.closingTime(),
          contract.address,
          contract.owner(),
          contract.min(),
          contract.max(),
          contract.vault()
        ]);
      })
      .then((results) => {
        commit(mutations.SET_STATIC_CROWDSALE_DETAILS, {
          rate: results[0],
          token: results[1].toString(),
          wallet: results[2].toString(),
          start: results[3].toNumber(10),
          end: results[4].toNumber(10),
          address: results[5],
          owner: results[6],
          min: results[7],
          max: results[8],
          vault: results[9]
        });
      });
    },
    [actions.REFRESH_CROWDSALE_DETAILS]({commit, dispatch, state}, account) {
      _crowdsale.deployed()
      .then((contract) => {
        return Promise.all([
          contract.weiRaised(),
          contract.whitelist(account),
          contract.contributions(account, {from: account}),
          contract.paused()
        ]);
      })
      .then((results) => {
        commit(mutations.SET_CROWDSALE_DETAILS, {
          raised: results[0],
          whitelisted: results[1],
          contributions: results[2],
          paused: results[3]
        });
      });
    },
    [actions.ADD_TO_KYC_WAITING_LIST]({commit, dispatch, state}, kycAccount) {
      commit(mutations.PUSH_TO_KYC_WAITING_LIST, kycAccount);
    },
    [actions.APPROVE_KYC]({commit, dispatch, state}, kycAccount) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.addToWhitelist(kycAccount, {from: state.account});
      })
      .then((res) => commit(mutations.REMOVE_FROM_KYC_WAITING_LIST, kycAccount));
    },
    [actions.VAULT_BALANCE]({commit, dispatch, state}) {
      if (state.vault) {
        web3.eth.getBalance(state.vault)
        .then((result) => {
          commit(mutations.SET_VAULT_BALANCE, result);
        });
      }
    },
    [actions.CONTRIBUTE_WEI]({commit, dispatch, state}, contributionInWei) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.buyTokens(state.account, {value: contributionInWei, from: state.account});
      });
    },
    [actions.PAUSE_CONTRACT]({commit, dispatch, state}) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.pause({from: state.account});
      });
    },
    [actions.UNPAUSE_CONTRACT]({commit, dispatch, state}) {
      _crowdsale.deployed()
      .then((contract) => {
        return contract.unpause({from: state.account});
      });
    }
  }
});

export default store;
