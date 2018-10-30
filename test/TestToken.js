var TestToken = artifacts.require("./TestToken.sol");

//accounts is from Ganache!!!!
//truffle console->web3.eth.accounts[0]
contract ('TestToken', function(accounts) {
	var tokenInstance;
	it('inializes the contract with the correct values', function() {
		return TestToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.name();

		}).then(function(name) {
			assert.equal(name,'TestToken', 'has the correct name');
			return tokenInstance.symbol();
		}).then(function(symbol) {
			assert.equal(symbol,'Test', 'has the correct symbol');
			return tokenInstance.standard();
		}).then(function(standard) {
			assert.equal(standard,'Test Token v1.0', 'has the correct standard');
		});
	})

	it('allocate the initial supply upon deployment', function() {
		return TestToken.deployed().then(function(instance) {
			tokenInstance=instance;
			return tokenInstance.totalSupply();
		}).then(function(totalSupply) {
			//Chi assetion library
			assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(adminBalance) {
			assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin account');

		});
	});

	it('transfers token ownership', function() {
		return TestToken.deployed().then(function(instance) {
			tokenInstance=instance;
			//Test 'require' statement first by transferring something larger than the sender's balance
			return tokenInstance.transfer.call(accounts[1], 99999999999999);  //DOES NOT TRIGGER A TRANSACTION (WITH CALL)
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
			return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] }); //FAKE TRANSACTION TO TEST FOR TRUE
		}).then(function(success) { //Check for the boolean return value 
			assert.equal(success, true, 'it returns true');
			return tokenInstance.transfer(accounts[1],250000, { from: accounts[0] }); //DOES TRIGGER THE TRANSACTION ! (WITHOUT CALL)
		}).then(function(receipt) { //Receipt of Transfer !
			//console.log(receipt);
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
			assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
			assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
			assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
			return tokenInstance.balanceOf(accounts[1]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(),250000, 'adds the amount to the receiving account');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(),750000, 'deducts the amount from the sending account');
		});

	});
});