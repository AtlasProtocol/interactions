# Governance Contract
The contract is designed for management of NRC20 token with two voter group. Voters are able to submit a proposal to make a transfer.
Proposals need to be voted for approve by at least half of each voter group.

# How to use

## Depoly your conrtact
`init(chairs, executors, contract)`

set your voters in two group `chairs` and `executors`. Set NRC20 contract `contract`.
Transfer certain amount of NRC20 token into the contract.

## Submit Proposal
`submitProposal(toAddress, amount, note)`

Submit your proposal.


`toAddress` Transfer to

`amount` Transfer amount

`note` note for this proposal such as purpose/proposal detail (optional).

## Vote

`voteForProposal(index, decision)`

`index` Proposal Index

`decision` 1 for approve, 0 for decline

## Get Proposals

`getOpenProposal`

Get all open proposals

`getClosedProposal`


Get all closed proposals (Approved or Declined). 