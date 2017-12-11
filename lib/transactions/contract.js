/** @module contract */

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
* @returns {Contract}
*/
function createContract(binary, amount, secret) {
  if (!binary || !amount || !secret)
    return false;

  var keys = secret;

  if (!crypto.isECPair(secret)) {
    keys = crypto.getKeys(secret);
  }

  if (!keys.publicKey) {
    throw new Error("Invalid public key");
  }

  var contract = {
    type: 9,
    amount: amount, // can suply contract with ark on publish
    fee: constants.fees.publishContract,
    recipientId: null, // send tyo 0X
    timestamp: slots.getTime(),
    asset: {
      code: binary
    }
  };

  contract.senderPublicKey = keys.publicKey;

  crypto.sign(contract, keys);

  contract.id = crypto.getId(contract);
  return contract;
}

module.exports = {
  createContract: createContract
}
