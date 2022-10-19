const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

describe("Test unstake functionality", async function() {
    let deb0xContract, user1Reward, user2Reward, user3Reward, frontend, dbxERC20;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        deb0xContract = await Deb0x.deploy(ethers.constants.AddressZero);
        await deb0xContract.deployed();

        const dbxAddress = await deb0xContract.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = deb0xContract.connect(user1)
        user2Reward = deb0xContract.connect(user2)
        user3Reward = deb0xContract.connect(user3)
        frontend = deb0xContract.connect(feeReceiver)
    })

    it("Stake action from a single account and check user address stake amount", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        let user3Balance = await dbxERC20.balanceOf(user3.address);
        //User3balanceDiv 4 will be 12.5 (50/4)
        let user3BalanceDiv4 = user3Balance / 4;
        let balanceBigNumberFormat = BigNumber.from(user3BalanceDiv4.toString());
        await dbxERC20.connect(user3).approve(deb0xContract.address, user3Balance)
        await user3Reward.stakeDBX(balanceBigNumberFormat)

        console.log("Balance account after first stake: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))
        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after second stake: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        await user3Reward.claimRewards();
        await user3Reward.stakeDBX(balanceBigNumberFormat)
        console.log("Balance account after third stake but in second cycle: " + ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address)))
        console.log("Acc  " + ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address)))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let valueToUnstake = await user3Reward.getUserWithdrawableStake(user3.address);
        console.log(valueToUnstake)
        expect(valueToUnstake).to.equal("37500000000000000000")
        console.log("Valoare la care trebuie facut unstake: " + ethers.utils.formatEther(valueToUnstake))
        await user3Reward.unstake("37000000000000000000")

        console.log("Valoare dupa unstake  " + ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address)))

        let amoutToUnstakeAfterTwoStakeActionInFirstCycle = ethers.utils.formatEther(await user3Reward.getUserWithdrawableStake(user3.address));
        console.log("Valoare dupa unstake  " + amoutToUnstakeAfterTwoStakeActionInFirstCycle);

    });

    it("Action during gap cycles should convert stake back to rewards and not grant fees for that stake", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()

        const user1AddressAccruedFees1 = await user1Reward.addressAccruedFees(user1.address)
s
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let user1Balance = await dbxERC20.balanceOf(user1.address);
        await dbxERC20.connect(user1).approve(deb0xContract.address, user1Balance)
        await user1Reward.stakeDBX(user1Balance)

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.unstake(user1Balance)
        const user1AddressAccruedFees2 = await user1Reward.addressAccruedFees(user1.address)
        expect(await dbxERC20.balanceOf(user1.address)).to.equal(user1Balance)
        expect(user1AddressAccruedFees2).equal(user1AddressAccruedFees1)

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        const user1AddressAccruedFees3 = await user1Reward.addressAccruedFees(user1.address)
        expect(user1AddressAccruedFees3).equal(user1AddressAccruedFees2)

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")
        console.log((await hre.ethers.provider.getBalance(deb0xContract.address)).toString())

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        const user1AddressAccruedFees4 = await user1Reward.addressAccruedFees(user1.address)

        expect(user1AddressAccruedFees4).equal(user1AddressAccruedFees3
            .add(await user1Reward.cycleAccruedFees(6)))
    })

    it("Action during gap cycles should convert stake back to rewards and not grant fees for that stake", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        const user1AddressAccruedFees1 = await user1Reward.addressAccruedFees(user1.address)

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        let user1Balance = await dbxERC20.balanceOf(user1.address)
        await dbxERC20.connect(user1).approve(deb0xContract.address, user1Balance)
        await user1Reward.stakeDBX(user1Balance.div(BigNumber.from("2")))

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        
        await user1Reward.claimFees()

        let feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let user1ClaimedFees = BigNumber.from("0")
        for(let entry of feesClaimed){
            user1ClaimedFees = user1ClaimedFees.add(entry.args.fees)
        }
        expect(user1ClaimedFees).to.equal(user1AddressAccruedFees1)
        // const user1AddressAccruedFees1 = await user1Reward.addressAccruedFees(user1.address)
        // console.log(user1AddressAccruedFees1.toString())
        // await user1Reward.unstake(user1Balance.div(BigNumber.from("2")))
        // const user1AddressAccruedFees2 = await user1Reward.addressAccruedFees(user1.address)
        // console.log(user1AddressAccruedFees2.toString())

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()

        feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for(let entry of feesClaimed){
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = (await user1Reward.cycleAccruedFees(0))
        .add(await user1Reward.cycleAccruedFees(2))
        .add(await user1Reward.cycleAccruedFees(4))

        const remainder = await hre.ethers.provider.getBalance(user1Reward.address);
        expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
    })

    it.only("Staking before reward cycle start and after should properly unlock in the next cycles", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()

        let user1Balance = await dbxERC20.balanceOf(user1.address)
        await dbxERC20.connect(user1).approve(deb0xContract.address, user1Balance)
        await user1Reward.stakeDBX(user1Balance.div(BigNumber.from("2")))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    
        await user1Reward.stakeDBX(user1Balance.div(BigNumber.from("2")))

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.unstake(user1Balance.div(BigNumber.from("2")))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()

        feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for(let entry of feesClaimed){
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = (await user1Reward.cycleAccruedFees(0))
        .add(await user1Reward.cycleAccruedFees(1))
        .add(await user1Reward.cycleAccruedFees(2))

        const remainder = await hre.ethers.provider.getBalance(user1Reward.address);
        expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
    })

    it.only("Staking before reward cycle start and after should properly unlock both stakes after two cycles", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()

        let user1Balance = await dbxERC20.balanceOf(user1.address)
        await dbxERC20.connect(user1).approve(deb0xContract.address, user1Balance)
        await user1Reward.stakeDBX(user1Balance.div(BigNumber.from("2")))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
    
        await user1Reward.stakeDBX(user1Balance.div(BigNumber.from("2")))

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()

        feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for(let entry of feesClaimed){
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = (await user1Reward.cycleAccruedFees(0))
        .add(await user1Reward.cycleAccruedFees(1))
        .add(await user1Reward.cycleAccruedFees(2))

        const remainder = await hre.ethers.provider.getBalance(user1Reward.address);
        expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
    })
});