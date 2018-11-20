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
			return tokenInstance.transfer.call(accounts[1], 9999999999999);  //DOES NOT TRIGGER A TRANSACTION (WITH CALL)
		}).then(assert.fail).catch(function(error) {
			//console.log(error.message);  						VM Exception while processing transaction: revert
			//console.log(error.message.indexOf('revert')); 	43
			assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');

			//Test for the boolean return value
			return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] }); //FAKE TRANSACTION TO TEST FOR TRUE
		}).then(function(success) { //Check for the boolean return value 
		 	assert.equal(success, true, 'it returns true');
		 	
		 	//Test for the Transfer function and analyze the receipt.logs
		 	return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] }); //DOES TRIGGER THE TRANSACTION ! (WITHOUT CALL)
		}).then(function(receipt) { //Receipt of Transfer !
			//console.log(receipt);
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
			assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
			assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
			assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
			
			//Test for the new balance of receiving account after the transfer !
			return tokenInstance.balanceOf(accounts[1]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
			
			//Test for the new balance of sending account after the transfer !
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(),750000, 'deducts the amount from the sending account');
		});

	});

	it('approves tokens for delegated transfer', function() {
		return TestToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 100);
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			//Trigger approve function and check the receipt
			return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
		}).then(function(receipt) { //Receipt of Approve event !
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Approval', 'should be the Approval event');
			assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
			assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
			assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
			return tokenInstance.allowance(accounts[0],accounts[1]);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
		});
	});

	it('handles delegated token transfer', function() {
		return TestToken.deployed().then(function(instance) {
			tokenInstance = instance;
			fromAccount = accounts[2];
			toAccount = accounts[3];
			spendingAccount = accounts[4]; //this account calls the function
			//Setup: Transfer some tokens to fromAccount
			return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
		}).then(function(receipt) {
			//Approve spendingAccount to spend 10 tokens from fromAccount
			return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
		}).then(function(receipt) {
			//Try transferring something larger than the sender's balance
			return tokenInstance.transferFrom(fromAccount, toAccount, 99999, { from: spendingAccount } );
		}).then(assert.fail).catch(function(error){
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
			// Try transferring some value larger than the approved amount
			return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
		}).then(assert.fail).catch(function(error){
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
			return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
		}).then(function(success) {
			assert.equal(success,true, 'it returns true');
			//Spending account transfers an amount of 10 from fromAccount to toAccount
			return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });

		}).then(function(receipt) { 
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
			assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
			assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
			assert.equal(receipt.logs[0].args._value, 10, 'logs the transferFrom amount');
			return tokenInstance.balanceOf(fromAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
			return tokenInstance.balanceOf(toAccount);
		}).then(function(balance) { 
			assert.equal(balance.toNumber(), 10, 'adds the amount to the receiving account');
			//the spendingAccount is allowed by the owner(fromAccount) to spend tokens from fromAccount
			return tokenInstance.allowance(fromAccount, spendingAccount); 
		}).then(function(allowance) {
			//Now we will have 0 amount allowed 
			assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
		})
	});
});