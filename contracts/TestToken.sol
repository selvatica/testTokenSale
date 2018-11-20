pragma solidity ^0.4.25;
 
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

	//Approve event
	event Approval(
		address indexed _owner,
		address indexed _spender,
		uint256 _value
	);
	//mapping in solidity is a hash table
	mapping(address => uint256) public balanceOf;
	
	//mapping for allowence
	//nested mapping  allowance[_owner][_spender]=_value
	mapping (address => mapping(address => uint256)) public allowance;  //getter function for free due to 'public' !
	

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

		//Fire transfer event
		emit Transfer(msg.sender, _to, _value);

		return true;
	}

	//Handle transfers where the account did not initially initiate the transfer (delegate transfer)
	//Delegate transfer

	//approve:   _spender is account B that will be approved on behalf of account A.. to spend amount _value of tokens
	function approve(address _spender, uint256 _value) public returns(bool success) {
		//All owner/approver accounts have an array of allowed accounts which are allowed to spend the owner's tokens
		//allowance[approver or owner of the account][allowed account]
		allowance[msg.sender][_spender] = _value;
		//Approve event
		emit Approval(msg.sender, _spender, _value);
		
		return true;
	}

	//transferForm I account A approve account B to spend my tokens
	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		
		//Require that _from has enough tokens
		require(_value <= balanceOf[_from]);
		
		//Require allowance is big enough 
		//msg.sender says: Hey I want the tokens from you (_from)
		require(_value <= allowance[_from][msg.sender]);
		
		//Change the balanceOf	
		balanceOf[_from] -= _value;
		balanceOf[_to] += _value;
		
		//update the allowance; The owner/approver(_from) of the account allows the requester (msg.sender) less tokens (_value) to withdraw 
		allowance[_from][msg.sender] -= _value;

		//Fire Transfer event
		emit Transfer(_from, _to, _value);
		return true;
	}
		
	
	
}