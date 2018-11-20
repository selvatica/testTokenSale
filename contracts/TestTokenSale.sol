pragma solidity ^0.4.25;
 
import "./TestToken.sol";

contract TestTokenSale {
	address admin;

	//new datatype TestToken
	TestToken public tokenContract;
	uint256 public tokenPrice;
	uint256 public tokensSold;  //Due to public, TokenSaleInstance.tokensSold() can be used!

	event Sell(address _buyer, uint256 _amount);

	constructor(TestToken _tokenContract, uint256 _tokenPrice) public {
		admin = msg.sender;
		tokenContract = _tokenContract;
		tokenPrice = _tokenPrice;
				
	}

	//pure is use for functions that do not do anything
	function multiply(uint x, uint y) internal pure returns (uint z) {
		require(y == 0 || (z = x * y) / y == x);
	}

	//Buy new tokens 
	//payable ..someone sends ether and receives tokens
	function buyTokens(uint256 _numberOfTokens) public payable {
		//Buy the correct value of tokens
		// Require that the value (value is METADATA in brackets in test) is equal to tokens
		//require (msg.value == _numberOfTokens * tokenPrice);
		require (msg.value == multiply(_numberOfTokens,tokenPrice));
		
		//Require that the contract has enough tokens
		require(tokenContract.balanceOf(this) >= _numberOfTokens);

		//Buy functionality
		require(tokenContract.transfer(msg.sender,_numberOfTokens));

		tokensSold += _numberOfTokens;
		emit Sell(msg.sender, _numberOfTokens);
	}

	//Ending TestToken sale
	function endSale() public {
		//require only admin can use this function 
		require(msg.sender == admin);

		// transfer remaining TestTokens to admin
		require(tokenContract.transfer(admin, tokenContract.balanceOf(this)));

		//destroy this contract after the token sale
		selfdestruct(admin);

		
	}

}