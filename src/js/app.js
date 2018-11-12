
window.addEventListener('load', async () => {
	// Modern dapp 	browsers...
  if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      console.log('Inside window.ethereum');
      try {
          // Request account access if needed
          await ethereum.enable();
          App.web3Provider = ethereum;
          return App.initContracts();
          // Acccounts now exposed
          //web3.eth.sendTransaction({/* ... */});//deleted by Sven
      } catch (error) {
          // User denied account access...
          console.log('User denied Access');
      }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
  		App.web3Provider = web3.currentProvider; //Added by Sven
  		console.log('Inside window.web3');
      window.web3 = new Web3(web3.currentProvider);
      return App.initContracts();
      // Acccounts always exposed
      //web3.eth.sendTransaction({/* ... */}); //deleted by Sven
  }
  // Non-dapp browsers...
  else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
  //return App.initContracts();
  
})


App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	tokensSold: 0,
	tokensAvailable: 750000,

	init: function() {
		console.log("App initialized...");
		//return App.initWeb3();
	},


	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			// If a web3 instance is already provided by Meta Mask.
			App.web3Provider = web3.currentProvider;
			console.log("Found a current provider");
		  web3 = new Web3(web3.currentProvider);
		  
		} else {
			//Specifiy default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
			web3 = new Web3(App.web3Provider);
			console.log("Current provider set to localhost");
		}
		return App.initContracts();
	},

	initContracts: function() {
		$.getJSON("TestTokenSale.json", function(testTokenSale) {
			App.contracts.TestTokenSale = TruffleContract(testTokenSale);
			App.contracts.TestTokenSale.setProvider(App.web3Provider);
			App.contracts.TestTokenSale.deployed().then(function(testTokenSale) {
				//testTokenSaleInstance=testTokenSale;
				console.log("Test Token Sale Address:", testTokenSale.address);
			});
		}).done(function() {
			$.getJSON("TestToken.json", function(testToken) {
				App.contracts.TestToken = TruffleContract(testToken);
				App.contracts.TestToken.setProvider(App.web3Provider);
				App.contracts.TestToken.deployed().then(function(testToken) {
					console.log("Test Token Address:", testToken.address);
				});
				App.listenForEvents();
				return App.render();
			});
		})
	},

	//Listen for events emitted from the contract
	listenForEvents: function() {
		App.contracts.TestTokenSale.deployed().then(function(instance) {
			instance.Sell({} , {
				fromBlock: 0,
				toBlock: 'latest',
			}).watch(function(error,event) {
				console.log("event triggered", event);
				App.render();
			})
		})

	},

	render: function() {
		if(App.loading){
			return;
		}
		App.loading=true;

		var loader = $('#loader');
		var content = $('#content');

		loader.show();
		content.hide();

		//Load account data
		web3.eth.getCoinbase(function(err, account) {
			if(err==null) {
				App.account = account;
				$('#accountAddress').html("Your Account: " + account);
			}
		})//.done(function() {
		//})

		//Loa token Sale Cntract
		App.contracts.TestTokenSale.deployed().then(function(instance) {
			testTokenSaleInstance = instance;
			console.log("contract");
			return testTokenSaleInstance.tokenPrice();
		}).then(function(price) {
			console.log("tokenPrice", price.toNumber());
			App.tokenPrice = price;
			$('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
			return testTokenSaleInstance.tokensSold();
		}).then(function(tokensSold){
			App.tokensSold = tokensSold.toNumber();
			$('.tokens-sold').html(App.tokensSold);
			//TokensAvalable is not a function of testTokenSale contract, but only of the testing environment...
		// 	return testTokenSaleInstance.tokensAvailable();  
		// }).then(function(tokensAvailable){
		// 	App.tokensAvailable=tokensAvailable.toNumber();
			App.contracts.TestToken.deployed().then(function(instance) {
				testTokenInstance=instance;
				return testTokenInstance.balanceOf(App.account);
			}).then(function(balance) {
				$('.test-balance').html(balance.toNumber());
				return testTokenInstance.balanceOf(testTokenSaleInstance.address);
			}).then(function(tokensAvailable){
				console.log("tokensAvailable", tokensAvailable.toNumber());
				App.tokensAvailable=tokensAvailable.toNumber();
				$('.tokens-available').html(App.tokensAvailable);

				var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) *100;
				$('#progress').css('width', progressPercent + '%');
				$('.progress-percent').html(progressPercent + '%'); //added by Sven :)

				App.loading =false;
				loader.hide();
				content.show();
			})

		})

		return App.getNetworkVersion();
	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();
		var numberOfTokens = $('#numberOfTokens').val();  //Read Input fiels
		App.contracts.TestTokenSale.deployed().then(function(instance) {
			return instance.buyTokens(numberOfTokens, {
					from: App.account, 
					value: numberOfTokens * App.tokenPrice, 
					gas: 500000
			})
		}).catch(function(error) { 
			console.log("Not so much tokens available...");
		}).then(function(result) {
				console.log("Tokens bought...");
				$('form').trigger('reset');
				//Wait for Sell Event here	
				//$('#loader').hide();
				//$('#content').show();
		})
	},

	getNetworkVersion: function() {
		web3.version.getNetwork((err, netId) => {
		  switch (netId) {
		    case "1":
		      console.log('This is mainnet')
		      break
		    case "2":
		      console.log('This is the deprecated Morden test network.')
		      break
		    case "3":
		      console.log('This is the ropsten test network.')
		      break
		    case "4":
		      console.log('This is the Rinkeby test network.')
		      break
		    case "42":
		      console.log('This is the Kovan test network.')
		      break
		    default:
		      console.log('This (', netId, ') is an unknown network. Probably you need to use Chrome Browser together with MetaMask!')
		  }
		})

	}
}


$(function() {
	$(window).load(function() {
		App.init();
	})
});