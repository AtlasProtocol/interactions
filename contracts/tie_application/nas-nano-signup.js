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

let Response = function (text) {
    if (!text) {
        this.responses = [];
    } else {
        let obj = JSON.parse(text);
        this.responses = obj.responses;
    }
};

Response.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let Value = function (text) {
    if (text) {
        let obj = JSON.parse(text);
        this.timestamp = obj.timestamp;
        this.txhash = obj.txhash;
        this.height = obj.height;
        this.response = obj.response;
    } else {
        this.timestamp = 0;
        this.txhash = "";
        this.height = 0;
        this.response = "";
    }

};

Value.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let BaseInteractTIE = function () {
    BaseTIE.call(this);
    // addresses that do interactions
    LocalContractStorage.defineMapProperty(this, 'AddressArrayMap');
    LocalContractStorage.defineMapProperty(this, 'VotedAddressMap');
    // count of total interactions
    LocalContractStorage.defineProperty(this, 'InteractCount');
    // count of addresses that do interactions
    LocalContractStorage.defineProperty(this, 'AddressCount');
    // addresses interaction stage
    LocalContractStorage.defineMapProperty(this, 'AddressStageMap');
    // transaction interactive element
    LocalContractStorage.defineProperty(this, 'TIE', {
        parse: function (text) {
            return JSON.parse(text)
        },
        stringify: function (o) {
            return o.toString()
        }
    });
    //interaction data map, address is the map key
    LocalContractStorage.defineMapProperty(this, 'InteractArrayMap', {
        parse: function (value) {
            return new Response(value);
        },
        stringify: function (o) {
            return o.toString(10);
        }
    });
    LocalContractStorage.defineMapProperty(this, 'ValidAnswerArrayMap', {
        parse: function (value) {
            return JSON.parse(value)
        },
        stringify: function (o) {
            return JSON.stringify(o)
        }
    });
};

(function () {
    let Super = function () {
    };
    Super.prototype = BaseTIE.prototype;
    BaseInteractTIE.prototype = new Super();
})();

BaseInteractTIE.prototype.init = function (executors, tie, master) {
    this.MasterAccount = Blockchain.transaction.from; // initialized as the address used to deploy the contract
    this.Paused = false; // pause method, only master account can do it
    this.InteractCount = 0;
    this.AddressCount = 0;
    this.ExecutorCount = 0;
    if (executors !== undefined) {
        this.addExecutors(executors);
    }
    if (tie !== undefined) {
        this.setTIE(tie);
    }
    if (master !== undefined) {
        this.setMasterAccount(master);
    }
    return 'deploy ok'
};

BaseInteractTIE.prototype._checkGetTIEPreCondition = function (address, preCondition) {
};

BaseInteractTIE.prototype._checkInteractPreCondition = function (address, key, preCondition) {
};

BaseInteractTIE.prototype._handler = function (address, key, variables) {
};

BaseInteractTIE.prototype._interact = function (address, key, response, preCondition, variables) {
    this._checkPaused();
    this._checkInteractPreCondition(address, key, preCondition);
    this._handler(address, key, variables);
    return this._setInteractMap(address, key, response)
};

BaseInteractTIE.prototype._setValidAnswerMap = function (key, response) {
    let map = this.ValidAnswerArrayMap.get(JSON.stringify(response));
    if (map === null) {
        map = [];
    }
    map.push(key);
    this.ValidAnswerArrayMap.set(JSON.stringify(response), map);
};

BaseInteractTIE.prototype._setInteractMap = function (address, key, response) {
    this._checkPaused();
    if (!key) {
        throw new Error("invalid interaction key");
    }
    this._setValidAnswerMap(key, response);
    let res = this.InteractArrayMap.get(key);
    let value = new Value();
    value.timestamp = Math.round(new Date().getTime() / 1000);
    value.txhash = Blockchain.transaction.hash;
    value.height = Blockchain.block.height;
    value.response = response;
    if (res === null) {
        res = new Response();
    }

    if (!this.VotedAddressMap.get(address)) {
        this.AddressCount += 1;
        this.AddressArrayMap.set(this.AddressCount, address);
        this.VotedAddressMap.set(address, true);
    }

    res.responses.push(value);
    this.InteractArrayMap.set(key, res);
    this.InteractCount += 1;
    this._responseEvent(key, response);
};

BaseInteractTIE.prototype._parseJson = function (str) {
    let result;
    try {
        result = JSON.parse(str);
    } catch (e) {
        return str
    }
    return result
};

BaseInteractTIE.prototype.setTIE = function (tie, signature) {
    this._checkAuthorization(signature);
    if (typeof tie !== "string") {
        throw new Error("tie has to be a string");
    }

    let parsedTie = this._parseJson(tie); // parsed

    if (typeof parsedTie === "string") {
        throw new Error("tie has to be a well-formed json");
    }

    this.TIE = tie;
    this._tieEvent(Blockchain.transaction.from, parsedTie);
    return true
};

BaseInteractTIE.prototype.getAllAddress = function () {
    let ret = [];
    for (let i = 1; i < this.AddressCount + 1; i++) {
        ret.push(this.AddressArrayMap.get(i));
    }

    return JSON.stringify(ret)
};

BaseInteractTIE.prototype.getTIE = function (address, preCondition) {
    this._checkPaused();
    this._checkGetTIEPreCondition(address, preCondition);
    return JSON.stringify(this.TIE)
};

BaseInteractTIE.prototype.getResponse = function (key) {
    return JSON.stringify(this.InteractArrayMap.get(key))
};

BaseInteractTIE.prototype.interacted = function (address) {
    return this.InteractArrayMap.get(address) !== null
};

BaseInteractTIE.prototype.interact = function (response, preCondition, variables) {
    return this._interact(Blockchain.transaction.from, Blockchain.transaction.from, response, preCondition, variables)
};

BaseInteractTIE.prototype.interactByProxy = function (address, response, signature, preCondition, variables) {
    this._checkAuthorization(signature);
    return this._interact(address, address, response, preCondition, variables)
};

BaseInteractTIE.prototype._tieEvent = function (from, value) {
    Event.Trigger("BaseInteractTIE", {
        From: from,
        TIE: value
    });
};

BaseInteractTIE.prototype._responseEvent = function (from, value) {
    Event.Trigger("BaseInteractTIE", {
        From: from,
        Response: value
    });
};

let SingleStageTIE = function () {
    BaseInteractTIE.call(this);
};

(function () {
    let Super = function () {
    };
    Super.prototype = BaseInteractTIE.prototype;
    SingleStageTIE.prototype = new Super();
})();

SingleStageTIE.prototype.getAddressWithResponse = function (response) {
    return JSON.stringify(this.ValidAnswerArrayMap.get(JSON.stringify(response)))
};

SingleStageTIE.prototype.getAllResponses = function () {
    let ret = [];
    for (let i = 1; i < this.AddressCount + 1; i++) {
        let address = this.AddressArrayMap.get(i);
        let responses = (JSON.parse(this.getResponse(address)))['responses'];
        let response = {};
        response.address = address;
        response.responses = responses;
        ret.push(response);
    }

    return JSON.stringify(ret)
};

let SingleStageVoteSingleResponse = function () {
    SingleStageTIE.call(this);
    this.TIEType = 'SV1.1.1';
};

(function () {
    let Super = function () {
    };
    Super.prototype = SingleStageTIE.prototype;
    SingleStageVoteSingleResponse.prototype = new Super();
})();

SingleStageVoteSingleResponse.prototype._checkInteracted = function (address) {
    if (this.InteractArrayMap.get(address) !== null) {
        throw new Error('Address already interacted.');
    }
};

SingleStageVoteSingleResponse.prototype._checkInteractPreCondition = function (address) {
    this._checkInteracted(address);
};

let NASNanoSignup = function () {
    SingleStageVoteSingleResponse.call(this);
    this.TIEType = 'NS1.0.1';
};

(function () {
    let Super = function () {
    };
    Super.prototype = SingleStageVoteSingleResponse.prototype;
    NASNanoSignup.prototype = new Super();
})();

NASNanoSignup.prototype.getTIE = function (address, preCondition) {
    this._checkPaused();
    this._checkGetTIEPreCondition(address, preCondition);
    let ret = {};
    ret.TIE = this.TIE;
    ret.Interacted = this.InteractArrayMap.get(address) !== null;
    return JSON.stringify(ret)
};

NASNanoSignup.prototype.getReceipt = function (address) {
    let res = this.InteractArrayMap.get(address);
    if (res !== null) {
        let ret = {};
        ret.interactBlockHeight = (res.responses)[0].height;
        ret.interactTxHash = (res.responses)[0].txhash;
        return JSON.stringify(ret)
    }
};

module.exports = NASNanoSignup;
