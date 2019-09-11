/**
 * Created by yiren on 2019-08-19
 * NRC20-governance.js  MultiSig for NRC20
 */

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

//proposal status
const STATUS_AWAIT = "Awaiting";
const STATUS_INPROGRESS = "In Progress";
const STATUS_APPROVED = "Approved";
const STATUS_DECLINED = "Declined";
const STATUS_TRANSFERRED = "Transferred";

//role
const ROLE_CHAIR = "role_chair";
const ROLE_EXEC = "role_executor";

class NRC20Governance {
    constructor() {
        LocalContractStorage.defineProperty(this, "chairGroup"); // save chairman group
        LocalContractStorage.defineProperty(this, "execGroup"); // save executors
        LocalContractStorage.defineProperty(this, "allVoter"); // save executors
        LocalContractStorage.defineProperty(this, "openProposal"); // await
        LocalContractStorage.defineProperty(this, "closedProposal"); // decided
        LocalContractStorage.defineProperty(this, "awaitTransferProposal"); // decided
        LocalContractStorage.defineProperty(this, "proposalIndex"); // index start at 0
        LocalContractStorage.defineProperty(this, "NRC20Contract"); // contract address
    }

    init(chairs, executors, contract) {
        this.chairGroup = JSON.parse(chairs);
        this.execGroup = JSON.parse(executors);
        this.proposalIndex = 0;
        this.openProposal = {};
        this.closedProposal = {};
        this.awaitTransferProposal = {};
        let allVoter = JSON.parse(chairs);
        let execGroup = JSON.parse(executors);
        for (let i = 0; i < execGroup.length; i++) {
            allVoter.push(execGroup[i]);
        }

        this.allVoter = allVoter;
        this.NRC20Contract = contract;

        if (chairs.length === 0 || executors === 0) {
            throw new Error("Please use two voter group");
        }

        return "Deploy Done";
    }

    submitProposal(toAddress, amount, note) {
        if (this._accessControl()) {
            let proposalData = {
                toAddress: toAddress,
                amount: amount,
                status: STATUS_AWAIT,
                vote: {},
                index: this.proposalIndex,
                note: note
            };

            let openBook = this.openProposal;
            let key = this.proposalIndex;
            openBook[key] = proposalData;
            this.openProposal = openBook;

            this.proposalIndex = this.proposalIndex + 1;

            return "Proposal Submitted";
        }
    }

    voteForProposal(index, decision) {
        if (this._accessControl()) {
            let openBook = this.openProposal;
            if (openBook[index]) {
                let proposal = openBook[index];
                let key = Blockchain.transaction.from;
                proposal.vote[key] = decision;
                openBook[index] = proposal;

                this.openProposal = openBook;

                this._statusChange(index);

                return "Voted";
            } else {
                throw new Error("NO Proposal Found");
            }
        }
    }

    startTransferForProposal(index) {
        if (this._accessControl()) {
            let closedProposal = this.closedProposal;
            let awaitTransferProposal = this.awaitTransferProposal;
            let proposal = awaitTransferProposal[index];

            if (proposal && proposal.status == STATUS_APPROVED) {
                this._proceedTransfer(index);



                proposal.status = STATUS_TRANSFERRED;
                closedProposal[index] = proposal;
                delete awaitTransferProposal[index];

                this.closedProposal = closedProposal;
                this.awaitTransferProposal = awaitTransferProposal;
                return "Making Transfer";
            } else {
                throw new Error("Proposal Status Error");
            }
        }
    }

    _proceedTransfer(index) {
        let awaitTransferProposal = this.awaitTransferProposal;
        let proposal = awaitTransferProposal[index];
        let amount = new BigNumber(proposal.amount * 1000000000000000000);

        var nrcContract = new Blockchain.Contract(this.NRC20Contract);
        nrcContract
            .value(0)
            .call("transfer", proposal.toAddress, amount.toString());

    }

    _statusChange(index) {
        let openProposal = this.openProposal;
        let closedProposal = this.closedProposal;
        let awaitTransferProposal = this.awaitTransferProposal;
        let proposal = openProposal[index];
        let chairGroup = this.chairGroup;
        let execGroup = this.execGroup;
        //vote for go
        let chairVoted = [];
        let execVoted = [];
        //vote for no go
        let chairRejected = [];
        let execRejected = [];
        if (proposal.vote) {
            // count for chair group
            for (let key of Object.keys(proposal.vote)) {
                for (let i = 0; i < chairGroup.length; i++) {
                    if (key === chairGroup[i]) {
                        if (proposal.vote[key] == 1) {
                            chairVoted.push(key);
                        } else {
                            chairRejected.push(key);
                        }
                    }
                }
            }

            //count for exec group
            for (let key of Object.keys(proposal.vote)) {
                for (let i = 0; i < execGroup.length; i++) {
                    if (key === execGroup[i]) {
                        if (proposal.vote[key] == 1) {
                            execVoted.push(key);
                        } else {
                            execRejected.push(key);
                        }
                    }
                }
            }

            //voters in both group
            if (
                chairVoted.length >= chairGroup.length / 2 &&
                execVoted.length >= execGroup.length / 2
            ) {
                //APPROVED
                proposal.status = STATUS_APPROVED;
                awaitTransferProposal[index] = proposal;

                delete openProposal[index];

                this.openProposal = openProposal;
                this.awaitTransferProposal = awaitTransferProposal;
            } else if (
                chairRejected.length >= chairGroup.length / 2 ||
                execRejected.length >= execGroup.length / 2
            ) {
                //REJECTED
                proposal.status = STATUS_DECLINED;
                closedProposal[index] = proposal;
                delete openProposal[index];

                this.openProposal = openProposal;
                this.closedProposal = closedProposal;
            } else {
                //INPROGRESS
                proposal.status = STATUS_INPROGRESS;
                openProposal[index] = proposal;
                this.openProposal = openProposal;
            }
        }
    }

    getOpenProposal() {
        return this.openProposal;
    }

    getClosedProposal() {
        return this.closedProposal;
    }

    getAwaitTransferProposal() {
        return this.awaitTransferProposal;
    }

    getContractInfo() {
        return {
            chairGroup: this.chairGroup,
            execGroup: this.execGroup,
            tokenContract: this.NRC20Contract
        };
    }

    _accessControl() {
        let from = Blockchain.transaction.from;
        let voter = this.allVoter;
        for (let index = 0; index < voter.length; index++) {
            if (voter[index] === from) {
                return true;
            }
        }

        let error = "NO ACCESS ";

        throw new Error(error);
    }
}

module.exports = NRC20Governance;
