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
const STATUS_INVALID = 3; //invalid info submitted

class Exchange {
    constructor() {
        LocalContractStorage.defineProperty(this, "addressBook"); // save address pairs
        LocalContractStorage.defineProperty(this, "addressBookExchanged"); // save address pairs that exchanged
        LocalContractStorage.defineProperty(this, "owner"); //admin
        LocalContractStorage.defineProperty(this, "valid"); //status of this contract interactions when valid = true
        LocalContractStorage.defineProperty(this, "pledgeAccount"); //ATP pledge account
        LocalContractStorage.defineProperty(this, "phase"); //Phase number of exchange offer
        LocalContractStorage.defineProperty(this, "executors"); //executor of contract
    }

    init(address, account) {
        this.addressBook = {};
        this.addressBookExchanged = {};
        this.owner = address;
        this.valid = true;
        this.pledgeAccount = account;
        this.phase = 1;
        this.executors = [];
    }

    submitInfo(hash, bnbAddress) {
        if (this.valid) {
            let data = {
                status: STATUS_INITAL,
                txHash: hash,
                bnbAddress: bnbAddress,
                hash: Blockchain.transaction.hash,
                phase: this.phase,
                from: Blockchain.transaction.from
            };
            let info = this.addressBook;
            let exchangedInfo = this.addressBookExchanged;
            let key = hash + Blockchain.transaction.from;
            if (info[key] || exchangedInfo[key]) {
                throw new Error('"Pair existed"');
            } else {
                info[key] = data;
                this.addressBook = info;
                this._submitEvent(data);
                return "Info submitted";
            }
        }
    }

    //Change STATUS_EXCHANGED
    exchangeToken(hash, from) {
        let exchangedInfo = this.addressBookExchanged;
        if (this._accessControl()) {
            let info = this.addressBook;
            let key = hash + from;
            if (info[key]) {
                let pair = info[key];
                pair.status = STATUS_EXCHANGED;
                exchangedInfo[key] = pair;
                this.addressBookExchanged = exchangedInfo;

                delete info[key];
                this.addressBook = info;
                this._exchangeEvent(pair);
                return pair;
            } else {
                return "No pair found";
            }
        }
    }

    //batching
    batchExchangeToken(keys) {
        if (this._accessControl()) {
            let keyArray = JSON.parse(keys);
            let exchangedInfo = this.addressBookExchanged;
            let info = this.addressBook;
            for (var index in keyArray) {
                let key = keyArray[index];
                if (info[key]) {
                    let pair = info[key];
                    pair.status = STATUS_EXCHANGED;
                    exchangedInfo[key] = pair;
                    delete info[key];
                } else {
                    return "Wrong key";
                }
            }
            this.addressBookExchanged = exchangedInfo;
            this.addressBook = info;
            return this.addressBookExchanged;
        }
    }

    //STATUS_RETURN
    returnToken(hash, from) {
        if (this._accessControl()) {
            let info = this.addressBook;
            let key = hash + from;
            let exchangedInfo = this.addressBookExchanged;
            if (info[key]) {
                let pair = info[key];
                pair.status = STATUS_RETURN;
                exchangedInfo[key] = pair;
                this.addressBookExchanged = exchangedInfo;

                delete info[key];
                this.addressBook = info;
                this._returnEvent(pair);
                return pair;
            } else {
                return "No pair found";
            }
        }
    }

    //STATUS_INVALID
    returnInvalidToken(hash, from) {
        if (this._accessControl()) {
            let info = this.addressBook;
            let key = hash + from;
            let exchangedInfo = this.addressBookExchanged;
            if (info[key]) {
                let pair = info[key];


                delete info[key];
                this.addressBook = info;
                this._returnEvent(pair);
                return pair;
            } else {
                return "No pair found";
            }
        }
    }

    //batching
    batchReturnInvalidToken(keys) {
        if (this._accessControl()) {
            let keyArray = JSON.parse(keys);
            let exchangedInfo = this.addressBookExchanged;
            let info = this.addressBook;
            for (var index in keyArray) {
                let key = keyArray[index];
                if (info[key]) {


                    delete info[key];
                } else {
                    return "Wrong key";
                }
            }
            this.addressBook = info;
            return this.addressBookExchanged;
        }
    }

    setPhase(num) {
        if (this._accessControl()) {
            this.phase = num;
            return this.phase;
        }
    }

    getInfoByAddress(hash, from) {
        let info = this.addressBook;
        let exchangedInfo = this.addressBookExchanged;
        let key = hash + from;
        if (info[key]) {
            return info[key];
        } else if (exchangedInfo[key]) {
            return exchangedInfo[key];
        } else {
            return "No pair found";
        }
    }

    getPhaseInfo() {
        let phaseInfo = {
            phase: this.phase,
            account: this.pledgeAccount,
            valid: this.valid,
            executors: this.executors
        };

        return phaseInfo;
    }

    getAccountAddress() {
        return this.pledgeAccount;
    }

    changeValidStatus() {
        if (this._accessControl()) {
            this.valid = !this.valid;
        }
    }

    setExecutor(executors) {
        if (this._ownerControl()) {
            let addrArray = JSON.parse(executors);
            this.executors = addrArray;
        }
    }

    _ownerControl() {
        if (Blockchain.transaction.from === this.owner) {
            return true;
        }

        throw new Error("NO ACCESS");
    }

    _accessControl() {
        let exec = this.executors;
        let from = Blockchain.transaction.from;

        for (let index = 0; index < exec.length; index++) {
            if (from === exec[index]) {
                return true;
            }
        }

        if (Blockchain.transaction.from === this.owner) {
            return true;
        }

        let error = 'NO ACCESS';

        throw new Error(error);
    }

    _submitEvent(value) {
        Event.Trigger("Submit", {
            data: value
        });
    }

    _exchangeEvent(value) {
        Event.Trigger("Exchange", {
            data: value
        });
    }

    _returnEvent(value) {
        Event.Trigger("Return", {
            data: value
        });
    }

    dumpAddressPair() {
        return this.addressBook;
    }

    dumpAddressPairExchanged() {
        return this.addressBookExchanged;
    }
}

module.exports = Exchange;
