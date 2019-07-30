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
const STATUS_IDLE = 3; //IDLE info submitted


class Exchange {
    constructor() {
        LocalContractStorage.defineProperty(this, "addressBook"); // save address pairs
        LocalContractStorage.defineProperty(this, "addressBookExchanged"); // save address pairs that exchanged
        LocalContractStorage.defineProperty(this, "owner");  //admin
        LocalContractStorage.defineProperty(this, "valid"); //status of this contract interactions when valid = true
        LocalContractStorage.defineProperty(this, "pledgeAccount"); //ATP pledge account
        LocalContractStorage.defineProperty(this, "phase"); //Phase number of exchange offer
        LocalContractStorage.defineProperty(this, "totalAmount"); //Total amount of exchange offer
    }

    init(address, account, amount) {
        this.addressBook = {};
        this.addressBookExchanged = {};
        this.owner = address;
        this.valid = true;
        this.pledgeAccount = account;
        this.phase = 1;
        this.totalAmount = amount;
    }

    submitInfo(hash, bnbAddress) {
        if (this.valid) {
            let data = {
                status: STATUS_INITAL,
                txHash: hash,
                bnbAddress: bnbAddress,
                hash: Blockchain.transaction.hash,
                phase: this.phase
            };
            let info = this.addressBook;
            let key = hash + Blockchain.transaction.from;
            if (info[key]) {
                return 'Pair existed'
            } else {
                info[key] = data;
                this.addressBook = info;
                this._submitEvent(data);
                return 'Info submitted'
            }

        } else {
            return "contract inactivated"
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
                return "No pair found"
            }

        } else {
            return "NO ACCESS";
        }
    }

    //batching
    batchExchangeToken(keys) {
        if (!this._accessControl()) {
            return 'NO ACCESS'
        }
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
                return 'Wrong key'
            }
        }
        this.addressBookExchanged = exchangedInfo;
        this.addressBook = info;
        return this.addressBookExchanged;

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
                return "No pair found"
            }
        } else {
            return "NO ACCESS"
        }
    }

    //STATUS_IDLE
    idleReturnToken(hash, from) {
        if (this._accessControl()) {
            let info = this.addressBook;
            let key = hash + from;
            let exchangedInfo = this.addressBookExchanged;
            if (info[key]) {
                let pair = info[key];
                pair.status = STATUS_IDLE;
                exchangedInfo[key] = pair;
                this.addressBookExchanged = exchangedInfo;

                delete info[key];
                this.addressBook = info;
                this._returnEvent(pair);
                return pair;
            } else {
                return "No pair found"
            }
        } else {
            return "NO ACCESS"
        }
    }

    setPhase(num) {
        if (!this._accessControl()) {
            return 'NO ACCESS'
        }

        this.phase = num;
        return this.phase;
    }

    getInfoByAddress(hash, from) {
        let info = this.addressBook;
        let exchangedInfo = this.addressBookExchanged;
        let key = hash + from;
        if (info[key]) {
            return info[key]
        } else if (exchangedInfo[key]) {
            return exchangedInfo[key];
        } else {
            return 'No pair found'
        }
    }

    getPhaseInfo() {
        let phaseInfo = {
            phase: this.phase,
            account: this.pledgeAccount,
            totalAmount: this.totalAmount,
            valid: this.valid
        }

        return phaseInfo;
    }

    getAccountAddress() {
        return this.pledgeAccount;
    }

    changevalidStatus() {
        if (this._accessControl()) {
            this.valid = !this.valid;
        } else {
            return 'NO ACCESS'
        }
    }

    _accessControl() {
        return Blockchain.transaction.from === this.owner;
    }

    _submitEvent(value) {
        Event.Trigger('Submit', {
            data: value
        })
    }

    _exchangeEvent(value) {
        Event.Trigger('Exchange', {
            data: value
        })
    }

    _returnEvent(value) {
        Event.Trigger('Return', {
            data: value
        })
    }

    dumpAddressPair() {
        return this.addressBook;
    }

    dumpAddressPairExchanged() {
        return this.addressBookExchanged;
    }
}

module.exports = Exchange;
