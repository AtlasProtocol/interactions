'use strict';

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

let BaseTIE = function () {
    LocalContractStorage.defineProperty(this, 'MasterAccount');
    LocalContractStorage.defineMapProperty(this, 'ExecutorArrayMap');
    LocalContractStorage.defineProperty(this, 'ExecutorCount');
    LocalContractStorage.defineProperty(this, 'Paused');
    LocalContractStorage.defineProperty(this, 'TIEType');
};

// functions with "_" prefix are private functions
BaseTIE.prototype = {
    init() {
        this.MasterAccount = Blockchain.transaction.from; // initialized as the address used to deploy the contract
        this.Paused = false; // pause method, only master account can do it
        this.ExecutorCount = 0;
        this.TIEType = '';
        return 'deploy ok'
    },

    // check if current address is the master account
    _checkMasterAccount() {
        if (this.MasterAccount !== Blockchain.transaction.from) {
            throw new Error("Unauthorized account")
        }
    },

    // check if the method have been paused
    _checkPaused() {
        if (this.Paused) {
            throw new Error("Method paused")
        }
    },

    // check if current address is master account or executor
    _checkAuthorization(signature) {
        if (this.MasterAccount !== Blockchain.transaction.from
            && !this.isExecutor(Blockchain.transaction.from, signature)) {
            throw new Error("Unauthorized account")
        }
    },

    // check if the address is a valid Nebulas address
    _checkValidAddress(address) {
        if (!Blockchain.verifyAddress(address)) {
            throw new Error("Invalid address")
        }
    },

    // master account can set the pause value to true or false
    setPause(value) {
        this._checkMasterAccount();
        this.Paused = value;
        this._pauseEvent(Blockchain.transaction.from, value);
    },

    // get contract state
    getState() {
        return {
            MasterAccount: this.MasterAccount,
            Paused: this.Paused,
            ExecutorCount: this.ExecutorCount
        }
    },

    // set master account, be cautious to do it
    setMasterAccount(address) {
        this._checkMasterAccount();
        this._checkValidAddress(address);
        this.MasterAccount = address;
        this._setMasterAccountEvent(Blockchain.transaction.from, address);
        return true
    },

    addExecutors(addresses) {
        this._checkMasterAccount();
        let arr = addresses.split(",");
        for (let i = 0; i < arr.length; ++i) {
            this._checkValidAddress(arr[i]);
            this.ExecutorArrayMap.set(arr[i], true);
            this.ExecutorCount += 1;
            this._executorEvent(arr[i]);
        }
    },

    // remove an address as executor
    removeExecutor(address) {
        this._checkMasterAccount();
        this._checkValidAddress(address);
        this.ExecutorArrayMap.delete(address);
        this.ExecutorCount -= 1;
    },

    isExecutor(address, signature) {
        return (this.ExecutorArrayMap.get(address) !== null) || this._checkSignature(address, signature)
    },

    Type() {
        return this.TIEType;
    },

    _checkSignature(address, signature) {
        if (signature !== undefined) {
            let crypto = require('crypto.js');
            let s3 = crypto.sha3256(address);
            return crypto.recoverAddress(1, s3, signature) === this.MasterAccount
        } else {
            return false
        }
    },

    _executorEvent(address) {
        Event.Trigger("BaseTIE", {
            Address: address
        });
    },

    _pauseEvent(from, value) {
        Event.Trigger("BaseTIE", {
            From: from,
            Paused: value
        });
    },

    _setMasterAccountEvent(from, value) {
        Event.Trigger("BaseTIE", {
            From: from,
            Address: value
        });
    }
};

let BaseCounterTIE = function () {
    BaseTIE.call(this);
    LocalContractStorage.defineMapProperty(this, 'CounterMap');
};

(function () {
    let Super = function () {
    };
    Super.prototype = BaseTIE.prototype;
    BaseCounterTIE.prototype = new Super();
})();

BaseCounterTIE.prototype.getCounter = function (key) {
    if (this.CounterMap.get(key) === null) {
        return 0
    }
    return this.CounterMap.get(key);
};

BaseCounterTIE.prototype.setCounter = function (key, value) {
    this._checkAuthorization();
    return this.CounterMap.set(key, value);
};

BaseCounterTIE.prototype.increaseCounter = function (key, value) {
    this._checkAuthorization();
    let val = this.getCounter(key);
    val += value;
    this.CounterMap.set(key, val);
    return val
};

BaseCounterTIE.prototype.decreaseCounter = function (key, value) {
    this._checkAuthorization();
    let val = this.getCounter(key);
    val -= value;
    if (val < 0) {
        val = 0;
    }
    this.CounterMap.set(key, val);
    return val
};

module.exports = BaseCounterTIE;
