
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

var testnet = 'http://127.0.0.1:4000';
var mainNetEndpoint = 'https://api.arknode.net/peer/transactions';
var config = {}; // network config

// account
var keys = 'height dance bottom plastic circle scrap will creek invest fever degree oven';
var myAddress = '';

var createTransaction = transaction.createTransaction;
var createContract = contract.createContract;
var createContractCall = contractCall.createContractCall;

function createAcc() {
  keys = crypto.getKeys(keys);
  myAddress = crypto.getAddress(keys.publicKey);
}


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

vorpal.command('deploy', 'deploys contract')
  .action(function (args, cb) {

    configureNetwork(testnet, function () {

      createAcc();

      getCompiledContract('simpleContract.sol', function (compiled) {

        var bytecodes = [];

        for (var contractName in compiled.contracts) {
          bytecodes.push(compiled.contracts[contractName].bytecode);
        }

        var contract = createContract(bytecodes[0], 1000, keys);

        postTransaction(testnet, contract, function (err, resp, body) {

          console.log(err || body);
          cb();
        })
      });
    });
  });

vorpal.command('call <address>', 'calls contract')
  .action(function (args, cb) {

    configureNetwork(testnet, function () {

      createAcc();

      var txId = args.address;

      getFromNode(testnet + '/api/transactions/get?id=' + txId, function (err, res, bd) {

        if (err || !JSON.parse(bd).success || !JSON.parse(bd).transaction) {
          console.log(err);
          cb();
        }

        var contractAddress = JSON.parse(bd).transaction.recipientId;

        var call = createContractCall(contractAddress, ' ', 1000, keys);

        postTransaction(testnet, call, function (err, res, body) {
          console.log(err || body);

          cb();
        });

      });
    });
  });

vorpal
  .delimiter('ark>')
  .show();

// configureNetwork(testnet, function () {

//   createAcc();

//   getCompiledContract('simpleContract.sol', function (compiled) {

//     var bytecodes = [];

//     for (var contractName in compiled.contracts) {
//       bytecodes.push(compiled.contracts[contractName].bytecode);
//     }

//     var contract = createContract(bytecodes[0], 1000, keys);

//     postTransaction(testnet, contract, getContractAndCall)
//   });

//   function getContractAndCall(err, res, body) {

//     if (err) {
//       console.log(err);
//       return;
//     }

//     var txId = body.transactionIds[0];

//     //wait for tx to be mined
//     setTimeout(function () {
//       getFromNode(testnet + '/api/transactions/get?id=' + txId, function (err, res, bd) {

//         if (err || !JSON.parse(bd).success) {
//           console.log(err);
//           return;
//         }

//         var contractAddress = JSON.parse(bd).transaction.recipientId;

//         var call = createContractCall(contractAddress, ' ', 1000, keys);

//         postTransaction(testnet, call, function(err, res, body) {
//           console.log(err || body);
//         });

//       });
//     }, 10000);
//   }
// });
