/**
 * Created by yiren on 2019-07-10
 *
 */

"use strict";
require("nebulas/lib/nvm/native");
const Exchange = require("./dex_exchange");

const exchange = new Exchange();
const initAddr = "aaa";
exchange.init(initAddr);

test("adds 1 + 2 to equal 3", () => {
  expect(exchange.owner).toBe(initAddr);
});
