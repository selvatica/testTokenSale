var TestToken = artifacts.require("./TestToken.sol");
var TestTokenSale = artifacts.require("./TestTokenSale.sol");


contract ('TestTokenSale', function(accounts) { 
	var TokenInstance;
	var TokenSaleInstance;
	var admin = accounts[0];
	var buyer = accounts[1];
	var tokenPrice= 1000000000000000; // in wei  0.001 ether
	var tokensAvailable =750000;
	var etherAvailable = 1000000000000000000; //in wei 1 ETH
	var numberOfTokens;

	it('initializes the contract with correct values', function() {
		return TestTokenSale.deployed().then(function(instance) {
			TokenSaleInstance = instance;
			return TokenSaleInstance.address;
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has contract address');
			return TokenSaleInstance.tokenContract;
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has Token contract address');
			return TokenSaleInstance.tokenPrice();
		}).then(function(price) {
			assert.equal(price, tokenPrice, 'Token price is correct');
		});
	});

	it('facilitates token buying', function() {
		return TestToken.deployed().then(function(instance) {
			//get access to TokenInstance
			TokenInstance = instance;
			return TestTokenSale.deployed();
		}).then(function(instance) {	
			//also get access to TokenSaleInstance
			TokenSaleInstance = instance;
			//provision 75% of tokens from admin account to tokenSale contract address
			return TokenInstance.transfer(TokenSaleInstance.address, tokensAvailable, { from: admin })
		}).then(function(receipt) {
			numberOfTokens = 10;
			return TokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: numberOfTokens * tokenPrice })
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
			assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
			assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
			return TokenSaleInstance.tokensSold();
		}).then(function(amount) {
			assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
			return TokenInstance.balanceOf(buyer);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), numberOfTokens, 'check balance');
			return TokenInstance.balanceOf(TokenSaleInstance.address);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens, 'check balance');
			//try to buy tokens different from the ether value e.g. 10 tokens for one Wei
			return TokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: 1 }); 
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
			return TokenSaleInstance.buyTokens(800000, {from: buyer, value: numberOfTokens * tokenPrice }); 
		}).then(assert.fail).catch(function(error) {
			//console.log(error);
			assert(error.message.indexOf('revert') >= 0, 'cannot purchose more tokens than available');
		});
	});
	
	// it('sends ETH from contract account to admin account', function() {
	// 	return TestTokenSale.deployed().then(function(instance) {
	//  	TokenSaleInstance = instance;
	//  	//Send some Ether to Smart Contract as initial value for testing
	//  	return admin.transfer(TokenSaleInstance.address, etherAvailable, { from: admin });
	//  }).then(function(receipt) {
	//  	console.log(receipt);
	//  	//assert.equal(receipt.logs.length, 1, 'triggers one event');
	// 	//assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
	// 	//assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
	// 	//assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');

	//  })
	// 		return TokenSaleInstance.
	// 	}).then(function(instance) {	
	//});

	it('ends token sale', function() {
		return TestToken.deployed().then(function(instance) {
			//get access to TokenInstance
			TokenInstance = instance;
			return TestTokenSale.deployed();
		}).then(function(instance) {	
			//also get access to TokenSaleInstance
			TokenSaleInstance = instance;
			//console.log('TokenSaleInstance Adress: ', TokenSaleInstance.address);
			//console.log('TokenInstance Adress: ', TokenInstance.address);
			//try to end sale
			return TokenSaleInstance.endSale({ from: buyer }); //This transaction must fail (buyer != admin). Look at the error
		}).then(assert.fail).catch(function(error) {
			//console.log(error.message);
			assert(error.message.indexOf('revert') >= 0, 'must be admin');
			return TokenSaleInstance.endSale({ from: admin }); //This will be a successfull transaction. Look at the receipt
		}).then(function(receipt) {  
			//check the receipt
			//console.log(receipt);
			return TokenInstance.balanceOf(admin);
		}).then(function(balance) { 
			assert.equal(balance.toNumber(),999990, 'returns all remaining tokens to admin');
			//Check that token Price was reset when selfdestruct was called
			return TokenSaleInstance.tokenPrice();
		}).then(assert.fail).catch(function(error) {
			//console.log(error.message);
			assert(error.message.indexOf('not a contract address') >= 0, 'Must call selfdestruct');
		});

	});
})