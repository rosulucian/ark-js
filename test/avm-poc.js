
var ark = require("../index.js");
var fs = require('fs');
var path = require('path');
var vorpal = require('vorpal')();

var transaction = ark.transaction;
var contract = ark.contract;
var contractCall = ark.contractCall;

var request = require("../node_modules/request");
var crypto = require("../lib/transactions/crypto");
var solc = require('solc');
var abi = require('ethereumjs-abi');

var testnet = 'http://127.0.0.1:4000';
var mainNetEndpoint = 'https://api.arknode.net/peer/transactions';
var config = {}; // network config

// account
var secret = 'height dance bottom plastic circle scrap will creek invest fever degree oven';
var keys = '';
var myAddress = '';

var createTransaction = transaction.createTransaction;
var createContract = contract.createContract;
var createContractCall = contractCall.createContractCall;

(function () {
  keys = crypto.getKeys(secret);
  myAddress = crypto.getAddress(keys.publicKey);
})();


function configureNetwork(server, cb) {
  request({
    url: server + '/api/loader/autoconfigure',
    json: {},
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "os": "linux3.2.0-4-amd64",
      "version": "0.3.0",
      "port": 1,
      "nethash": ""
    }
  }, function (error, response, body) {

    if (error) {
      console.log(error.message);
      return;
    }

    config = body.network;
    crypto.setNetworkVersion(config.version);

    console.log(config);
    console.log("nethash: " + config.nethash);

    cb();
  });
}

function getFromNode(url, cb) {

  var nethash = config.nethash;

  request(
    {
      url: url,
      headers: {
        nethash: nethash,
        version: '1.0.0',
        port: 1
      },
      timeout: 5000
    },
    cb
  );
}

function postTransaction(server, transaction, cb) {

  request({
    url: server + '/peer/transactions',
    json: { transactions: [transaction] },
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "os": "linux3.2.0-4-amd64",
      "version": "0.3.0",
      "port": 1,
      "nethash": config.nethash
    }
  }, cb);
}

function getCompiledContract(file, cb) {
  if (!file)
    return null;

  file = path.join(__dirname, file);

  fs.readFile(file, 'utf8', function (err, data) {
    if (err)
      throw err;

    var compiled = solc.compile(data);

    cb(compiled);
  });
}

vorpal.command('deploy [file]', 'deploys contract')
  .action(function (args, cb) {

    configureNetwork(testnet, function () {

      // createAcc();

      var file = args.file ? args.file : 'simpleContract.sol';

      getCompiledContract(file, function (compiled) {

        var bytecodes = [];

        for (var contractName in compiled.contracts) {
          bytecodes.push(compiled.contracts[contractName].bytecode);
        }

        var contract = createContract(bytecodes[0], 1000, keys);

        postTransaction(testnet, contract, function (err, resp, body) {

          console.log(err || body);
          return cb();
        })
      });
    });
  });

vorpal.command('call <address> [abifile]', 'calls the first method of the contract')
  .action(function (args, cb) {

    var contractAddress = args.address;

    function callContract(data) {

      console.log(data);

      getFromNode(testnet + '/api/accounts?address=' + contractAddress, function (err, res, bd) {

        if (err || !JSON.parse(bd).success) {
          console.log(err);
          return cb();
        }

        var contract = JSON.parse(bd);
        var contractAddress = contract.account.address;

        var call = createContractCall(contractAddress, data, 1000, keys);

        postTransaction(testnet, call, function (err, res, body) {
          console.log(err || body);

          return cb();
        });
      });
    }

    configureNetwork(testnet, function () {

      // createAcc();

      getCompiledContract('simpleContract.sol', function (compiled) {

        var contracts = [];
        var data = '';

        for (var contractName in compiled.contracts) {

          compiled.contracts[contractName].interface = JSON.parse(compiled.contracts[contractName].interface);

          contracts.push(compiled.contracts[contractName]);
        }

        var contract = contracts[0];

        data = contract.functionHashes[Object.keys(contract.functionHashes)[0]];

        var param = abi.rawEncode(['uint'], [1]).toString('hex');

        data += param;

        console.log(param);

        callContract(data);
      });
    });
  });

vorpal
  .delimiter('ark>')
  .show();
