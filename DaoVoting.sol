// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Simple DAO Voting Contract
/// @notice Anyone can create proposals and vote once per proposal
contract DaoVoting {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) voters;
    }

    Proposal[] public proposals;
    address public owner;
    uint256 public constant VOTING_PERIOD = 3 days;

    event ProposalCreated(uint256 id, string description, uint256 deadline);
    event Voted(uint256 proposalId, address voter, bool support);
    event ProposalExecuted(uint256 id, bool passed);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProposal(string memory _description) public {
        Proposal storage newProposal = proposals.push();
        newProposal.description = _description;
        newProposal.deadline = block.timestamp + VOTING_PERIOD;
        emit ProposalCreated(proposals.length - 1, _description, newProposal.deadline);
    }

    function vote(uint256 proposalId, bool support) public {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!proposal.voters[msg.sender], "Already voted");

        proposal.voters[msg.sender] = true;
        if (support) {
            proposal.votesFor += 1;
        } else {
            proposal.votesAgainst += 1;
        }
        emit Voted(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) public {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.deadline, "Voting not finished");
        require(!proposal.executed, "Already executed");
        proposal.executed = true;
        emit ProposalExecuted(proposalId, proposal.votesFor > proposal.votesAgainst);
    }

    function getProposalsCount() public view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 proposalId) public view returns (
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 deadline,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.deadline,
            proposal.executed
        );
    }
}
