pragma solidity ^0.4.24;

contract TestToken {
	//Name (public variable gives getter and setter functions for free!!)
	string public name = "TestToken";
	//Symbol
	string public symbol ="Test";
	//Standard (not part of ERC20 standard)
	string public standard ="Test Token v1.0";
	//state variable public; solidity provides a getter and setter function for free
	uint256 public totalSupply;

	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
		);

	//mapping in solidity is a hash table
	mapping(address => uint256) public balanceOf;
	
	//Constructor; use _ for local variables 
	constructor(uint256 _initialSupply) public {
		balanceOf[msg.sender] = _initialSupply;
		totalSupply = _initialSupply; //mint initial tokens
    	//allocat einitial totalSupply

  	}
	//set the total number of tokens
	// Read the total number of tokens

	//Transfer
	function transfer(address _to, uint256 _value) public returns (bool success) {
		//Exception if account doesn't have enough tokens
		require(balanceOf[msg.sender] >= _value); //require will stop function execution and throw an error

		//transfer the balance;
		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;

		//Transfer event
		emit Transfer(msg.sender, _to, _value);

		return true;
	}
		
	
	
}