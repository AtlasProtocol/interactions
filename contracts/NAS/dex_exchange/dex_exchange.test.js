/**
 * Created by yiren on 2019-07-10
 *
 */

"use strict";
require("nebulas/lib/nvm/native");
const Exchange = require("./dex_exchange");

const exchange = new Exchange();
const initAddr = "bfaldjfasbdjkshaf";
const initAccount = "bbb";
const transferHash = "aabbccddd";
const bnbAddress = "bnbadfaf";

exchange.init(initAddr, initAccount);

// mock transaction
const txFrom = initAddr;
const txHash = "gauidyfahfvaskjfhgaksjg";
const mockTx = {
    value: "5",
    from: txFrom,
    hash: txHash
};
Blockchain.transactionParse(JSON.stringify(mockTx));

test("contract init success", () => {
    expect(exchange.owner).toBe(initAddr);
    expect(exchange.pledgeAccount).toBe(initAccount);
    expect(exchange.valid).toBe(true);
});

test("submitInfo success", () => {
    const hash = transferHash;
    const submitInfo = exchange.submitInfo(hash, bnbAddress);
    expect(submitInfo).toBe("Info submitted");
    const info = exchange.addressBook;
    // console.log("info", info);
    const key = hash + txFrom;
    expect(info[key]).toEqual({
        status: 0,
        txHash: transferHash,
        bnbAddress: bnbAddress,
        hash: Blockchain.transaction.hash,
        phase: 1,
        from: Blockchain.transaction.from
    });
});

test("exchangeToken success", () => {
    const pair = exchange.exchangeToken(transferHash, txFrom);
    expect(pair).toEqual({
        status: 1,
        txHash: transferHash,
        bnbAddress: bnbAddress,
        hash: Blockchain.transaction.hash,
        phase: 1,
        from: Blockchain.transaction.from
    });
});
