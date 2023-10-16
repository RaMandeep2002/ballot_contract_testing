const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Ballot test cases ', async () => {
  let owner;
  let voter1;
  let voter2;
  let voter3;
  let voter4;
  let chairPerson;
  let votingContract;
  beforeEach(async () => {
    [owner, chairPerson, voter1, voter2, voter3, voter4] =
      await ethers.getSigners();
    const ProposalList = [
      '0x506572736f6e3100000000000000000000000000000000000000000000000000',
      '0x506572736f6e3200000000000000000000000000000000000000000000000000',
    ];
    const VotingContract = await ethers.getContractFactory('Ballot');
    votingContract = await VotingContract.deploy(ProposalList);
  });

  // it('This testcase for printing the address use in Contract', async () => {
  //   // console.log(`Voting contract is deployed at ${votingContract.address}`);
  //   console.log('Address of owner of the contract ', owner.address);
  //   console.log('Address of chairperson of the contract ', chairPerson.address);
  //   console.log('Address of voter1 of the contract ', voter1.address);
  //   console.log('Address of voter2 of the contract ', voter2.address);
  // });
  describe('giveRightToVote() Function Testing', async () => {
    it('Only chairperson can give right to vote.', async () => {
      // console.log('Inside Function');
      const initialWeight = await votingContract.voters(voter1.address);
      expect(initialWeight.weight).to.equal(0);

      // console.log('Owner address: - ', owner.address);
      const chairperson = await votingContract.chairperson();
      // console.log('Chairperson address: - ', chairperson);
      expect(chairperson).to.equal(owner.address);

      await votingContract.connect(owner).giveRightToVote(voter1.address);

      const voter1Weight = await votingContract.voters(voter1.address);

      expect(voter1Weight.weight).to.equal(1);
    });
    it('The voter already voted.', async () => {
      // console.log('Inside Function');
      const initialWeight = await votingContract.voters(voter1.address);
      expect(initialWeight.weight).to.equal(0);

      // console.log('Owner address: - ', owner.address);
      const chairperson = await votingContract.chairperson();
      // console.log('Chairperson address: - ', chairperson);
      expect(chairperson).to.equal(owner.address);

      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(voter1).vote(0);
      await votingContract.connect(owner).giveRightToVote(voter2.address);

      const voter1Weight = await votingContract
        .connect(owner)
        .voters(voter1.address);

      expect(voter1Weight.weight).to.equal(1);

      await expect(votingContract.connect(voter1).vote(0)).to.be.revertedWith(
        'Already voted.'
      );
    });
    it('should not give the right to vote to a voter with existing weight', async function () {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(voter1).vote(0);
      await expect(votingContract.connect(voter1).vote(0)).to.be.revertedWith(
        'Already voted.'
      );
    });
  });
  describe('delegate() Function testing', async () => {
    it('should chekc the delegating to other', async () => {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(owner).giveRightToVote(voter2.address);

      await votingContract.connect(voter1).delegate(voter2.address);

      const voter1Info = await votingContract.voters(voter1.address);
      // console.log(voter1Info);
      expect(voter1Info.delegate).to.equal(voter2.address);

      const voter2Info = await votingContract.voters(voter2.address);
      // console.log(voter2Info);
      expect(voter2Info.weight).to.equal(2);
    });
    it('require to != msg.sender Self-delegation is disallowed.', async () => {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await expect(
        votingContract.connect(voter1).delegate(voter1.address)
      ).to.be.revertedWith('Self-delegation is disallowed.');
    });
  });
  describe('Vote() function testing', async () => {
    it('should allow a voter to cast their vote', async () => {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(voter1).vote(1);

      const voterInfo = await votingContract.voters(voter1.address);
      expect(voterInfo.voted).to.equal(true);
      expect(voterInfo.vote).to.equal(1);

      const proposal = await votingContract.proposals(0);
      expect(proposal.voteCount).to.equal(0);
    });
  });
  describe('winningProposal() testing', async () => {
    it('should calculate the winning proposal', async () => {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(owner).giveRightToVote(voter2.address);
      await votingContract.connect(owner).giveRightToVote(voter3.address);
      await votingContract.connect(owner).giveRightToVote(voter4.address);
      // let signer = await ethers.getSigners();
      // console.log('entr');
      // await votingContract.connect(owner).giveRightToVote(signer[0].address);
      // console.log('entr');

      // await votingContract.connect(owner).giveRightToVote(signer[1].address);
      // await votingContract.connect(owner).giveRightToVote(signer[2].address);
      // await votingContract.connect(owner).giveRightToVote(signer[3].address);

      await votingContract.connect(voter1).vote(0);
      await votingContract.connect(voter2).vote(1);
      await votingContract.connect(voter3).vote(0);
      await votingContract.connect(voter4).vote(0);
      // await votingContract.connect(signer[0]).vote(1);
      // await votingContract.connect(signer[1]).vote(1);
      // await votingContract.connect(signer[3]).vote(1);
      // await votingContract.connect(signer[4]).vote(1);

      const winningProposal = await votingContract.winningProposal();
      // console.log(winningProposal);
      expect(winningProposal).to.equal(0);
    });
  });
  describe(' winnerName()', async () => {
    it('should return the name of the winning proposal ', async () => {
      await votingContract.connect(owner).giveRightToVote(voter1.address);
      await votingContract.connect(owner).giveRightToVote(voter2.address);

      await votingContract.connect(voter1).vote(0);
      await votingContract.connect(voter2).vote(1);

      const winnerName = await votingContract.winnerName();
      expect(winnerName).to.equal(
        '0x506572736f6e3100000000000000000000000000000000000000000000000000'
      );
    });
  });
});
