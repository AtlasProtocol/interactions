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
const amount = 50000;
exchange.init(initAddr, initAccount, amount);

test("adds 1 + 2 to equal 3", () => {
    expect(exchange.owner).toBe(initAddr);
    expect(exchange.pledgeAccount).toBe(initAccount);
    // expect(exchange.totalAmount).toBe(amount);
});
