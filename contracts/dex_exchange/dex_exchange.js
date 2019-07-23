
"use strict";

/*
 Copyright (C) 2019 atp contract authors

 This file is part of the atp contract library.

 the atp contract library is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 the atp contract library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with the atp contract library.  If not, see <http://www.gnu.org/licenses/>.

*/


const STATUS_INITAL = 0; //Attend
const STATUS_EXCHANGED = 1; //Token exchanged to BEP2
const STATUS_RETURN = 2; //Fail


class Exchange {
  constructor() {
    LocalContractStorage.defineProperty(this, "addressArray"); //array to save address pairs
    LocalContractStorage.defineProperty(this, "owner");  //admin
    LocalContractStorage.defineProperty(this, "switch"); //switch of this contract
    LocalContractStorage.defineProperty(this, "account"); //ATP pledge account
  }

  init(address, account) {
    this.addressArray = [];
    this.owner = address;
    this.switch = true;
    this.account = account;
  }

  submitInfo(hash, bnbAddress) {
    if (this.switch) {
      let data = {
        status: STATUS_INITAL,
        txHash: hash,
        bnbAddress: bnbAddress,
        hash: Blockchain.transaction.hash
      };
      let info = this.addressArray;
      info.push(data);

      this.addressArray = info;
    }else {
      return "contract inactivated"
    }
  }

  //Change STATUS_EXCHANGED
  exchangeCoin(hash) {
    if (this._accessControl()) {
      let info = this.addressArray;
      var index;
      for (index in info) {
        if (info[index].hash == hash) {
          info[index].status = STATUS_EXCHANGED;
          this.addressArray = info;
          return info[index];
        }
      }
    } else {
      return "NO ACCESS";
    }
  }

  //STATUS_RETURN
  returnCoin(hash) {
    if (this._accessControl()) {
      let info = this.addressArray;
      var index;
      for (index in info) {
        if (info[index].hash == hash) {
          info[index].status = STATUS_RETURN;
          this.addressArray = info;
          return info[index];
        }
      }
    } else {
      return "NO ACCESS"
    }
  }

  getInfoByAddress(bnbAddress) {
    let info = this.addressArray;
    let index;
    let result = [];
    for (index in info) {
      if (info[index].bnbAddress === bnbAddress) {
        result.push(info[index])
      }
    }
    return result;
  }

  getAccountAddress() {
    return this.account;
  }

  changeSwitchStatus() {
    if (this._accessControl()) {
      this.switch = !this.switch;
    }else {
      return 'NO ACCESS'
    }
  }

  _accessControl() {
    return Blockchain.transaction.from === this.owner;
  }

  dumpAll() {
    console.log(this.addressArray);
    return this.addressArray;
  }
}

module.exports = Exchange;
