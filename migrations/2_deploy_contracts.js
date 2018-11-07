var TestToken = artifacts.require("./TestToken.sol");
var TestTokenSale = artifacts.require("./TestTokenSale.sol");

module.exports = function(deployer) {
	//add here constructor values in sequence
  deployer.deploy(TestToken, 1000000).then(function() {
  	// tokenPrice is 0.001 Ether
  	var tokenPrice= 1000000000000000; // in wei = 0.001 ether
  	return deployer.deploy(TestTokenSale, TestToken.address, tokenPrice);
  	
  }) 
};


