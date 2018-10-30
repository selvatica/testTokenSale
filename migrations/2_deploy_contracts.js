var TestToken = artifacts.require("./TestToken.sol");

module.exports = function(deployer) {
  deployer.deploy(TestToken, 1000000); //add here constructor values in sequence
};


