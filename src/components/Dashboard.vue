<template>
  <div id="dashboard">

    <b-jumbotron :header="tokenSymbol" lead="Welcome to the creation of a truly disruptive equity crowdfunding platform">
      <div class="row">
        <div class="col-lg-6">
          <h4>Owner</h4>
          <eth-address :hex="owner"></eth-address>
        </div>
        <div class="col-lg-6">
          <div class="alert alert-success" role="alert">
            <strong>Crowdsale contract address:</strong>
            <eth-address :hex="address"></eth-address>
          </div>
        </div>
      </div>
      
      <p class="float-right"><strong>{{ raised.toString(10) }}</strong>
        <eth-symbol></eth-symbol>
      </p>

      <b-progress show-value :max="cap" class="mb-3 thermometer" height="50px">
        <b-progress-bar variant="primary" :value="raised"></b-progress-bar>
      </b-progress>

    </b-jumbotron>

    <div class="row marketing">
      <div class="col-lg-5">
        <h4>Rate</h4>
        <p>
          {{ rate.toString(10) }}
          <eth-symbol></eth-symbol>
          per {{ tokenSymbol }} Token
        </p>

        <h4>Min. Contribution</h4>
        <p>{{ min.toString(10) }}
          <eth-symbol></eth-symbol>
        </p>

        <h4>Max. Contribution</h4>
        <p>{{ max.toString(10) }}
          <eth-symbol></eth-symbol>
        </p>


      </div>
      <div class="col-lg-2">
        &nbsp;
      </div>
      <div class="col-lg-5">
        <h4>Start Date</h4>
        <p>{{ start | moment('from') }}</p>

        <h4>End Date</h4>
        <p>{{ end | moment('from') }}</p>

        <h4>Paused?</h4>
        <p>{{ paused }}</p>
      </div>
    </div>

  </div>
</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import Progress from 'bootstrap-vue/es/components/progress/progress';
  import ProgressBar from 'bootstrap-vue/es/components/progress/progress-bar';
  import EthSymbol from './EthSymbol';
  import EthAddress from './EthAddress.vue';

  export default {
    name: 'dashboard',
    components: {EthSymbol, EthAddress},
    computed: {
      ...mapState([
        'address',
        'tokenName',
        'rate',
        'raised',
        'token',
        'cap',
        'start',
        'end',
        'tokenSymbol',
        'min',
        'max',
        'start',
        'end',
        'owner',
        'paused'
      ]),
      ...mapGetters([])
    }
  };
</script>

<style lang="scss" scoped>
  .thermometer {
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
