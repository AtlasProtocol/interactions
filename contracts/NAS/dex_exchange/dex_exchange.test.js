/**
 * Created by yiren on 2019-07-10
 *
 */

"use strict";
require("nebulas/lib/nvm/native");
const Exchange = require("./dex_exchange");

const exchange = new Exchange();
const initAddr = "aaa";
const initAccount = "bbb";
exchange.init(initAddr, initAccount);

// mock 一个 transaction
const txFrom = "bfaldjfasbdjkshaf";
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

test("submitInfo ", () => {
    const hash = "aabb";
    const bnbAddress = "bnbadfaf";
    const submitInfo = exchange.submitInfo(hash, bnbAddress);
    expect(submitInfo).toBe("Info submitted");
    const info = exchange.addressBook;
    // console.log("info", info);
    const key = hash + txFrom;
    expect(info[key]).toEqual({
        status: 0,
        txHash: hash,
        bnbAddress: bnbAddress,
        hash: Blockchain.transaction.hash,
        phase: 1,
        from: Blockchain.transaction.from
    });
});
