import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Replace with your deployed contract address!
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const abi = [
  // Minimal ABI for front-end interaction
  {
    "inputs": [
      { "internalType": "string", "name": "_description", "type": "string" }
    ],
    "name": "createProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "internalType": "bool", "name": "support", "type": "bool" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "executeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProposalsCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "votesFor", "type": "uint256" },
      { "internalType": "uint256", "name": "votesAgainst", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "bool", "name": "executed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [proposals, setProposals] = useState([]);
  const [proposalDesc, setProposalDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const isDev = true;

  // Wallet connection
  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask required!");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
  };

  // Get proposals
  const getProposals = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const count = await contract.getProposalsCount();
      const proposalsArr = [];
      for (let i = 0; i < count; i++) {
        const [description, votesFor, votesAgainst, deadline, executed] = await contract.getProposal(i);
        proposalsArr.push({ id: i, description, votesFor: votesFor.toString(), votesAgainst: votesAgainst.toString(), deadline, executed });
      }
      setProposals(proposalsArr);
    } catch {
      setProposals([]);
    }
  };

  // Create proposal
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!proposalDesc) return;
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.createProposal(proposalDesc);
      await tx.wait();
      setProposalDesc("");
      getProposals();
    } catch (e) {}
    setLoading(false);
  };

  // Vote
  const handleVote = async (id, support) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.vote(id, support);
      await tx.wait();
      getProposals();
    } catch (e) {}
    setLoading(false);
  };

  // Execute proposal
  const handleExecute = async (id) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.executeProposal(id);
      await tx.wait();
      getProposals();
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (window.ethereum) getProposals();
  }, []);

  return (
    <div style={{ maxWidth: 550, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>🗳️ DAO Voting DApp</h2>
      {isDev && (
        <div style={{ background: "#f9dede", border: "1px solid #eeaaaa", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <b>⚠️ This dApp is in development!</b><br/>
          Open to collaboration — check the <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">GitHub</a>!<br/>
          MIT Licensed.
        </div>
      )}
      {!currentAccount ? (
        <button style={{ background: "#7cc", color: "#222", border: "none", borderRadius: "6px", padding: "0.7rem 1.4rem", fontWeight: "bold", cursor: "pointer" }} onClick={connectWallet}>
          Connect MetaMask
        </button>
      ) : (
        <div>
          <form onSubmit={handleCreate} style={{ marginBottom: "2rem" }}>
            <input
              style={{ width: "70%", marginRight: "2%" }}
              type="text"
              placeholder="New proposal description"
              value={proposalDesc}
              onChange={e => setProposalDesc(e.target.value)}
              required
            />
            <button
              type="submit"
              style={{ background: "#6f4e37", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", padding: "0.5rem 1.2rem", cursor: "pointer" }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Proposal"}
            </button>
          </form>
        </div>
      )}
      <h3>Active Proposals:</h3>
      <div>
        {proposals.length === 0 ? <div>No proposals yet.</div> :
          proposals.map(p => (
            <div key={p.id} style={{ background: "#f5f5f5", marginBottom: "1rem", padding: "1rem", borderRadius: "8px" }}>
              <b>#{p.id}:</b> {p.description}<br/>
              <span>Votes For: <b>{p.votesFor}</b> | Votes Against: <b>{p.votesAgainst}</b></span><br/>
              <span>Deadline: {new Date(p.deadline * 1000).toLocaleString()}</span><br/>
              <span>Status: {p.executed ? <b style={{color: "green"}}>Executed</b> : <b style={{color: "red"}}>Pending</b>}</span><br/>
              {!p.executed && currentAccount && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button onClick={() => handleVote(p.id, true)} style={{ marginRight: "0.5rem", background: "#7f7", border: "none", borderRadius: "4px", fontWeight: "bold", padding: "0.3rem 0.9rem", cursor: "pointer" }}>Vote For</button>
                  <button onClick={() => handleVote(p.id, false)} style={{ marginRight: "0.5rem", background: "#f77", border: "none", borderRadius: "4px", fontWeight: "bold", padding: "0.3rem 0.9rem", cursor: "pointer" }}>Vote Against</button>
                  <button onClick={() => handleExecute(p.id)} style={{ background: "#ccc", border: "none", borderRadius: "4px", fontWeight: "bold", padding: "0.3rem 0.9rem", cursor: "pointer" }}>Execute</button>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default App;
