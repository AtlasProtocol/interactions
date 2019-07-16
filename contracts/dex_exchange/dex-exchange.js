/**
 * Created by yiren on 2019-07-10
 *
 */

"use strict";

const STATUS_INITAL = 0; //初始参与
const STATUS_EXCHANGED = 1; //已转换至BEP-2
const STATUS_RETURN = 2; //返回NRC20 或参与失败退币

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
      status: STATUS_INITAL,
      txhash: hash,
      bnbAddress: bnbAddress,
      hash: Blockchain.transaction.hash
    };
    let info = this.addressArray;
    info.push(data);

    this.addressArray = info;
  }

  //已转换至BEP-2
  exchangeCoin(hash) {
    if (Blockchain.transaction.from != this.owner) {
      return "NO Access";
    } else {
      let info = this.addressArray;
      var index;
      for (index in info) {
        if (info[index].hash == hash) {
          info[index].status = STATUS_EXCHANGED;
          this.addressArray = info;
          return info[index];
        }
      }
    }
  }

  //已返回NRC20
  returnCoin(hash) {
    if (Blockchain.transaction.from != this.owner) {
      return "NO Access";
    } else {
      let info = this.addressArray;
      var index;
      for (index in info) {
        if (info[index].hash == hash) {
          info[index].status = STATUS_RETURN;
          this.addressArray = info;
          return info[index];
        }
      }
    }
  }

  getInfoByTx(bnbAddress) {
    let info = this.addressArray;
    var index;
    for (index in info) {
      if (info[index].bnbAddress == bnbAddress) {
        return info[index];
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
