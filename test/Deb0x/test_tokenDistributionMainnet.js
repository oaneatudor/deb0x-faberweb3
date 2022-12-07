const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")
const { NumUtils } = require("../utils/NumUtils.ts");

let DEBOX_ADDRESS = "0x3a473a59820929D42c47aAf1Ea9878a2dDa93E18";
let DEBOXVIEW_ADDRESS = "0x3a6B3Aff418C7E50eE9F852D0bc7119296cc3644";
let DBX_ADDRESS = "0x855201bA0e531DfdD84B41e34257165D745eE97F"
let addresses = [
    "0x083e05e9db5dad2af555258e960931860bda7096",
    "0x0bc5e470689c7042370dee85b92e216f5a60ebb2",
    "0x16ee6ce5d7428a028bc9a08ee69b3814c9717a06",
    "0x1971d9f65dc652b726da023f09507629b3b358e5",
    "0x32ff0e97339975186fb83f9a6a181ec4de48aa32",
    "0x40922a8c7aa8117ac62adf381b2149aef98ab7c5",
    "0x4b42f0a8a3e270ada60e0fa0b15be79fd68bdb85",
    "0x555b03fd17ca089feace5e68b31cadf87424b488",
    "0x5b4afca3b882dbb0e35618608621a45a8068a729",
    "0x6380cbd365f0b363296e514d9e901ea5fe0267e7",
    "0x76c508fb3c11ca9192122792c110f53e724615cb",
    "0x7bdbd04519a09ac1159980db0b03e6119053d885",
    "0x845a1a2e29095c469e755456aa49b09d366f0beb",
    "0x90bf2a422f0e6ac00376c813536adba1b527350f",
    "0x9c3c2f4c8fc85190af7759fea09e536ec0c5978d",
    "0x9d8ea60bee0d3e965b59e409e6869c2545b083a9",
    "0xa2784173d3dd644021f766951b00c8a00259887b",
    "0xa329a183fc21ee87f1e33d3e1cfba010aee362e8",
    "0xa4fe18a8bb61c43aefdf88cff6a02d506d40e0b9",
    "0xa7dbd4bcaa39d91b0db9f94015d33a11eaf2c289",
    "0xa907b9ad914be4e2e0ad5b5fecd3c6cad959ee5a",
    "0xabf18532a66aaf8eeca5808140aec07b6f1eb331",
    "0xb64d32ed2d062e6400b2db51fdc3d0ba8e1d9336",
    "0xba677f4842ddcffc35badf3cb525d56d2dbb0e66",
    "0xc8fb199f3d4f3ebcd112023ceb9536ca12a4d198",
    "0xd1c740e1c900a586afc8a570a2c2eedef5ffbd9d",
    "0xebe8fdef1fdd9b3dde5b06abd0b941fa2998ecd2",
    "0xef7921205d5798dfa54fd23ced5644509d69394f",
    "0xf44570d260b6a54b716ac7ad71745dfbacc3f345",
    "0xf55cf45cbae4fd3fdd54bb00398cc8e8635a75ba",
    "0xfab6081ba365dd87623b3fdaa8f0bb0d4413030e",
    "0x3a473a59820929d42c47aaf1ea9878a2dda93e18"
]
async function test() {

    const Deb0x = await ethers.getContractFactory("Deb0x");
    let deb0xContract = await Deb0x.attach(DEBOX_ADDRESS);

    const Deb0xViews = await ethers.getContractFactory("Deb0xViews");
    let deb0xViewContract = await Deb0xViews.attach(DEBOXVIEW_ADDRESS);

    const DBX = await ethers.getContractFactory("Deb0xERC20");
    let dbx_erc20 = await DBX.attach(DBX_ADDRESS);

    let totalRewardUntilCurrentCycle = 0;
    let currentCycle = await deb0xContract.currentCycle();
    totalRewardUntilCurrentCycle = BigNumber.from(NumUtils.day1()).add(BigNumber.from(NumUtils.day2()))
    for (let i = 2; i < currentCycle - 2; i++) {
        let intermediateBalance = NumUtils.day(i);
        let middle = BigNumber.from(intermediateBalance).add(BigNumber.from(totalRewardUntilCurrentCycle))
        totalRewardUntilCurrentCycle = middle
    }
    let totalAmountAtStakeFirstStake = BigNumber.from("0");;
    let totalAmountAtStakeaccSecondStake = BigNumber.from("0");;
    let totalBalanceOfDBX = BigNumber.from("0");
    let totalUnclaimedReward = BigNumber.from("0");

    for (let i = 0; i < addresses.length; i++) {

        let actualBalance = await dbx_erc20.balanceOf(addresses[i]);
        if (actualBalance != 0) {
            let intermediateBalance = BigNumber.from(totalBalanceOfDBX).add(BigNumber.from(actualBalance));
            totalBalanceOfDBX = intermediateBalance;
        }

        let unclaimedReward = await deb0xViewContract.getUnclaimedRewards(addresses[i]);
        if (unclaimedReward != 0) {
            let intermediatForUnclaimedReward = BigNumber.from(totalUnclaimedReward).add(BigNumber.from(unclaimedReward));
            totalUnclaimedReward = intermediatForUnclaimedReward
        }

        let stakeCycle = Number(await deb0xContract.accFirstStake(addresses[i]));
        let amountInStake = await deb0xContract.accStakeCycle(addresses[i], stakeCycle);
        if (amountInStake != 0) {
            let intermediateForStake = BigNumber.from(totalAmountAtStakeFirstStake).add(BigNumber.from(amountInStake));
            totalAmountAtStakeFirstStake = intermediateForStake;
        }

        let stakeCycle2 = Number(await deb0xContract.accSecondStake(addresses[i]));
        let amountInStake2 = await deb0xContract.accStakeCycle(addresses[i], stakeCycle2);
        totalAmountAtStakeaccSecondStake = BigNumber.from(totalAmountAtStakeaccSecondStake).add(amountInStake2);
        if (amountInStake2 != 0) {
            let intermediateForStake2 = BigNumber.from(totalAmountAtStakeaccSecondStake).add(BigNumber.from(amountInStake2));
            totalAmountAtStakeaccSecondStake = intermediateForStake2;
        }

    }
    let totalFrom = BigNumber.from(totalBalanceOfDBX).add(BigNumber.from(totalUnclaimedReward)).add(BigNumber.from(totalAmountAtStakeFirstStake)).add(BigNumber.from(totalAmountAtStakeaccSecondStake))
};

test();