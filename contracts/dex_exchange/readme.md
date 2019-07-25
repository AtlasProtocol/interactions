#Exchange Offer Contract
The contract is used to save address pairs as well as relative status.<br/>
The amount of transactions will not be verified by contract.

#Interface

**```init(address, account)```**<br/>
Initialization of contract. <br/>
`address` admin address <br/>
`account` official account address that take atp tokens <br/>
<br/>

`submitInfo(hash, bnbAddress)`<br/>
Submit transaction hash and bnb address<br/>
`hash` transaction hash that user send to ATP official address <br/>
`bnbAddress` user's bnb address<br/>
<br/>

`getInfoByAddress(bnbAddress)`<br/>
Get address pair by bnb address<br/>

`getAccountAddress()`<br/>
Get ATP official address

`dumpAll()`<br/>
Get All address pairs



