var ark = require("../index.js");
var fs = require('fs');
var path = require('path');

var transaction = ark.transaction;
var contract = ark.contract;

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

function createAcc()
{
    keys = crypto.getKeys(keys);
    myAddress = crypto.getAddress(keys.publicKey);
}


function configureNetwork(server,cb)
{
    request({
    //   url: mainNetEndpoint,
    // url: 'http://'+server+'/peer/status',
    url: server+'/api/loader/autoconfigure',
      json: { },
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "os": "linux3.2.0-4-amd64",
        "version": "0.3.0",
        "port": 1,
        "nethash": ""
      }
    }, function(error, response, body) {

        if(error){
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

function postTransaction(server, transaction)
{

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
      }, function(error, response, body) {
        console.log(error || body);
      });

}

function getCompiledContract(file, cb)
{
  if(!file)
    return null;

  file = path.join(__dirname, file);

  fs.readFile(file, 'utf8', function (err, data) {
    if (err)
      throw err;

    var compiled = solc.compile(data);

    cb(compiled);
  });
}

configureNetwork(testnet, function(){

    createAcc();

    getCompiledContract('simpleContract.sol', function(compiled) {

      var bytecodes = [];

      for (var contractName in compiled.contracts)
      {
        bytecodes.push(compiled.contracts[contractName].bytecode);
      }

      var contract = createContract(bytecodes[0], 1000, keys);
      postTransaction(testnet, contract)
    });

    var tx = createTransaction("a3N9LJ9YSsFHkDfi6tMTviSNwwRWNTvNTC", 1, null, keys);
    // postTransaction(testnet, tx);
});
