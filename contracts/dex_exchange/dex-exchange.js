/**
 * Created by yiren on 2019-07-10
 *
 */

"use strict";

class Exchange {
  constructor() {
    LocalContractStorage.defineProperty(this, "addressArray");
    LocalContractStorage.defineProperty(this, "owner");
  }

  init(address) {
    this.addressArray = [];
    this.owner = address;
  }

  submitInfo(hash, bnbAddress) {
    let data = {
      status: 0,
      txhash: hash,
      bnbAddress: bnbAddress,
      hash: Blockchain.transaction.hash
    };
    let obj = this.addressArray;
    obj.push(data);

    this.addressArray = obj;
  }

  changeStatus(bnbAddress) {
    if (Blockchain.transaction.from != this.owner) {
      return "无权访问";
    } else {
      let obj = this.addressArray;
      var x;
      for (x in obj) {
        if (obj[x].bnbAddress == bnbAddress) {
          obj[x].status = 1;
          this.addressArray = obj;
          return obj[x];
        }
      }
    }
  }
  getInfoByTx(bnbAddress) {
    let obj = this.addressArray;
    var x;
    for (x in obj) {
      if (obj[x].bnbAddress == bnbAddress) {
        return obj[x];
      }
    }
  }

  dumpAll() {
    console.log(this.addressArray);
    return this.addressArray;
  }
}

module.exports = Exchange;

//n1gkcc7y1vfLPtXHey3NNGNParUZKYohWEy

//n1yVcAda3ijEKSPiaJcXzBc3pnGvwErJEVk

// {"pageParams":{"pay":{"currency":"NAS","value":"0","to":"n1yVcAda3ijEKSPiaJcXzBc3pnGvwErJEVk","payload":{"function":"submitInfo","args":"["hash1","bnb1"]","type":"call"}}},"des":"confirmTransfer","category":"jump"}
