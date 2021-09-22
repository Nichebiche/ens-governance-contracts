const { task } = require('hardhat/config');
const config = require('./config');
const { ShardedMerkleTree } = require('./src/merkle');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

task("maketree", "Generates a merkle airdrop tree").setAction(async () => {
  let airdrops;
  let shardNybbles = 1;
  if(hre.network.tags.test) {
    const signers = await ethers.getSigners();
    airdrops = signers.map((signer, index) => [
      signer.address,
      {
        past_tokens: '500000000000000000000000',
        future_tokens: '500000000000000000000000',
        longest_owned_name: '0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6', // keccak256('test')
        last_expiring_name: '0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6',
        balance: '1000000000000000000000000',
        has_reverse_record: index % 2 == 0,
      }
    ]);
  } else {
    const fs = require('fs');
    airdrops = fs.readFileSync('airdrop.json', {encoding: 'utf-8'}).split('\n').filter((x) => x.length > 0).map((line) => {
      const data = JSON.parse(line);
      const owner = data.owner;
      delete data.owner;
      data.balance = ethers.BigNumber.from(data.past_tokens).add(ethers.BigNumber.from(data.future_tokens)).toString();
      return [owner, data];
    });
    shardNybbles = 2;
  }
  ShardedMerkleTree.build(
    airdrops,
    shardNybbles,
    `airdrops/${hre.network.name}`
  );
});

module.exports = {
  solidity: "0.8.7",
  namedAccounts: {
    deployer: {
      default: 0
    },
  },
  networks: {
    hardhat: {
      initialDate: config.UNLOCK_BEGIN,
      tags: ["test"],
    },
    mainnet: {
      url: "http://localhost:8545/",
    }
  },
};
