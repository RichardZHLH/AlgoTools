# how to admin SC

Our bridge smart contract admin role has the following functions
1. sync the storeman configure/status from wanchain.
this is used by robot.

2. configure the tokenpair Fee.

The non-interactive mode
``` bash
$ node adminTool.js  --configType 1 --tokenPairId 770 --fee 773 
```

The interactive mode
``` bash
$ node adminTool.js 
please input your config type:      
1: config tokenPair Fee
2: config chain Pair Fee
3: opt in a Asset
config type: 1
Input token pair ID: 770
Input token pair Fee: 773

```
To use 'node getInfo.js' to check the result.

3. configure the fromchain-tochain contract fee and agent fee
The non-interactive mode
``` bash
node adminTool.js  --configType 2 --fromChain 2147483931 --toChain 2153201998 --contractFee 200000 --agentFee 0
```

The interactive mode
``` bash
$ node adminTool.js 
please input your config type:      
1: config tokenPair Fee
2: config chain Pair Fee
3: opt in a Asset
config type: 2
Input from chain ID: 2147483931
Input to chain ID: 2153201998
Input contract Fee: 1234
Input agent Fee: 4321
```

4. optin an Asset
when an account receiving a Asset, the account must optin the asset first.
To support userlock into contract address, the contract must optin the asset first.
The non-interactive mode
``` bash
node adminTool.js --configType 3 --assetId 10458941
```

The interactive mode
``` bash
$ node adminTool.js
please input your config type:      
1: config tokenPair Fee
2: config chain Pair Fee
3: opt in a Asset
config type: 3
Input optin Asset ID: 10458941
```