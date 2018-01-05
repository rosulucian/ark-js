/** @module contractCall */

var crypto = require("./crypto.js"),
  constants = require("../constants.js"),
  slots = require("../time/slots.js");

/**
* @static
* @param {string} recipientId
* @param {number} amount
* @param {string|null} vendorField
* @param {ECPair|string} secret
* @param {ECPair|string} [secondSecret]
* @returns {ContractCall}
*/
function createContractCall(contractAddress, params, amount, secret) {

  if (!contractAddress || !params || !amount || !secret)
    return false;

  var keys = secret;

  if (!crypto.isECPair(secret)) {
    keys = crypto.getKeys(secret);
  }

  if (!keys.publicKey) {
    throw new Error("Invalid public key");
  }

  var contractCall = {
    type: 10,
    amount: amount, // fee
    fee: constants.fees.publishContract, // do we need this?
    recipientId: contractAddress, // send to 0X
    timestamp: slots.getTime(),
    asset: {
      params: params
    }
  };

  contractCall.senderPublicKey = keys.publicKey;

  crypto.sign(contractCall, keys);

  contractCall.id = crypto.getId(contractCall);

  return contractCall;
}

module.exports = {
  createContractCall: createContractCall
}
