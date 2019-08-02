# Token Exchange Offer Contract
As decentralised exchanges getting to their next stage into maturity , ATP is proposing to be listed on Binance Dex. ATP holders will have the chance to exchange their NRC20 based ATP tokens (based on Nebulas) to BEP2 based ATP tokens (based on Binance Chain).

# Why BEP2?
The listing on Binance Dex will not affect total supply of ATP tokens. ATP will provide an exchange offer to let ATP token holders to pledge NRC20 tokens for BEP2 tokens. Atlas Protocol will also provide an official bonus up to 5% of the total amount in the exchange offer.  After exchange offer completed, token holders will be able to trade ATP tokens in Binance DEX for BNB and buy ATP tokens using BNB. 
<br/>
<br/>
You can participate at https://my.atlaspro.io/campaign/dex_exchange


# Interface

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

`exchangeCoin(hash, from)` <br/>
process exchange by hash <br/>
`hash` transaction hash submitted <br/>
`from` address that associated with the transaction

`batchExchangeCoin(keys)` <br/>
Batch process exchange <br/>
`keys` array of keys, key = hash + from

`getInfoByAddress(bnbAddress)`<br/>
Get address pair by bnb address<br/>

`getAccountAddress()`<br/>
Get ATP official address

`dumpAddressPair()`<br/>
Get All address pairs participated

`dumpAddressPairExchanged()`<br/>
Get All address pairs that exchanged

`getPhaseInfo()`<br/>
Get info of current phase

# Events

`Submit` <br/>
When user submit address pair to participate.

`Exchange` <br/>
When Atlas Protocol confirm that address pair is valid and BEP2 token transferred to BNB address submitted.

`Return` <br/>
When Atlas Protocol confirm that address pair is NOT valid.
