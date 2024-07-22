# How to generate a proposol

The cli proposol script proposolCli.js support interactive or non-interactive

For interactive mode, the Cli will ask you questions, you need input the parameter.
For non-interactive mode, you can input the parameter on the CLI command.

The command will generate 2 files.
1. the unsigned file, placed in File Transaction.txt
This file will be used for Offline sign.
2. the boxes.json.
This will will be used for wanchain configure contract. Agent need it.

## 1. add admin proposol
The non-interactive mode

``` bash
node proposolCli.js  --proposolType 1 --adminAddr KZKBWUVRVTBK6KP2ZAYZBZNJLGNYGGDGAF6GILWROR5VDTEEP5NXKBCFJI
```

The interactive mode
``` bash
$ node proposolCli.js 
please input your proposol type:
      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
    
proposol type: 1
Input new admin address: KZKBWUVRVTBK6KP2ZAYZBZNJLGNYGGDGAF6GILWROR5VDTEEP5NXKBCFJI
```

This command will generate an unsigned transaction in the file Transaction.json. This file could be used for Offline sign.
This command will generate the boxes in the file boxes.json. This file will be used for wanchain config contract.

## 2. remove admin proposol
The non-interactive mode

``` bash
node proposolCli.js  --proposolType 2 --adminAddr KZKBWUVRVTBK6KP2ZAYZBZNJLGNYGGDGAF6GILWROR5VDTEEP5NXKBCFJI
```
The interactive mode
``` bash
$ node proposolCli.js
please input your proposol type:
      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
    
proposol type: 2
Input want to removed admin address: KZKBWUVRVTBK6KP2ZAYZBZNJLGNYGGDGAF6GILWROR5VDTEEP5NXKBCFJI
```



## 6 add token pair
The non-interactive mode

``` bash
node proposolCli.js  --proposolType 6 --tokenPairId 790 --sourceChain 2147483931 --sourceAccount 0x00000000009f973d --destChain 2153201998 --destAccount 0x7ff465746e4f47e1cbbb80c864cd7de9f13337fe

node proposolCli.js  --proposolType 6 --tokenPairId 770 --sourceChain 2147483931 --sourceAccount 0x0000000000000000 --destChain 2153201998 --destAccount 0xf5d9fe62a64d5ce624b351d3fc9c2e0599acdd0b
```
The interactive mode
``` bash
node proposolCli.js 
please input your proposol type:
      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
    
proposol type: 6
Input token pair id: 790
Input source chain: 2147483931
Input source Account: 0x00000000009f973d
Input destination chain: 2153201998
Input destination Account: 0x7ff465746e4f47e1cbbb80c864cd7de9f13337fe
```

## 7 remove token pair
The non-interactive mode

``` bash
node proposolCli.js --proposolType 7 --tokenPairId 790
```
The interactive mode
``` bash
node proposolCli.js 
please input your proposol type:
      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
    
proposol type: 7
Input token pair id: 790
```

## 8 update token pair

The non-interactive mode

``` bash
node proposolCli.js  --proposolType 8 --tokenPairId 888 --sourceChain 2147483931 --sourceAccount 0x00000000009f973d --destChain 2153201998 --destAccount 0x7ff465746e4f47e1cbbb80c864cd7de9f13337fe

```
The interactive mode
``` bash
node proposolCli.js 
please input your proposol type:
      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
    
proposol type: 8
Input token pair id: 888
Input source chain: 2147483931
Input source Account: 0x00000000009f973d
Input destination chain: 2153201998
Input destination Account: 0x7ff465746e4f47e1cbbb80c864cd7de9f13337fe
```
