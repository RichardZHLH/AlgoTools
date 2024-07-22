const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const algosdk = require('algosdk')
const fs = require('fs')
const abi = require('./artifacts_cross/contract.json')
const util = require('./util.js')



const testnet = 1
let bridge_id, algodClient
if(testnet) {
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else {

}


let acct = algosdk.mnemonicToSecretKey(process.env.MN)
console.log("acct:", acct.addr)

async function createAlgoAppTx(methodName, args, box, foreignAssets=[]) {
    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName(methodName);
  
    let suggestedParams = await algodClient.getTransactionParams().do(); 
   
    let appArgs = [method.getSelector()]
    method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
    // console.log("appArgs:", appArgs)
  
    const options = {
        from: acct.addr,
        suggestedParams: suggestedParams,
        appIndex: bridge_id,
        appArgs:appArgs,
        foreignAssets,
        boxes:box
    }

    // console.log("options:", options)
    const unsignedTx = algosdk.makeApplicationCallTxnFromObject(options);
    console.log("unsignedTx:", unsignedTx)
    const signedTxn = unsignedTx.signTxn(acct.sk);

    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);
  }



async function main() {   
    // await createAlgoAppTx('transferUpdateOwner', ['WBKFZYUAYUXA55ENGAASBFZ2YZ43562VEUKX4PZDA45PVNA76EZZLWLZPU'], [])
    // await createAlgoAppTx('setStoremanGroupConfig', [
    //     Buffer.from('000000000000000000000000000000000000000000746573746e65745f303631', 'hex'),
    //     5, 
    //     Buffer.from('dacc38e9bc3a8ccf2a0642a1481ab3ba4480d9a804927c84c621ac394d556b01351f98176e1614272a242f6ca31d21b8baead46be6b0c0f354a4fbfb477f6809', 'hex'),
    //     parseInt(Date.now()/1000)-10000000,
    //     parseInt(Date.now()/1000)+10000000,
    // ], [
    //     {appIndex: bridge_id, name: util.getPrefixAddrKey('mapAdmin', acct.addr)},
    //     {appIndex: bridge_id, name: new Uint8Array(Buffer.from('000000000000000000000000000000000000000000746573746e65745f303631', 'hex')) },
    // ])

    await createAlgoAppTx('setStoremanGroupConfig', [
        Buffer.from('000000000000000000000000000000000000000000746573746e65745f303636', 'hex'),
        5, 
        Buffer.from('9cf2d927ba1b676b1ea7b0779e1528240fefecf97fcefd11344bd4fd8065f681fb4ea3af0c3272c53403fd2a092f7d256913a1786c2ead25cdd9b4505e466a91', 'hex'),
        1720497600,
        1723176000,
    ], [
        // {appIndex: bridge_id, name: util.getPrefixAddrKey('mapAdmin', acct.addr)},
        {appIndex: bridge_id, name: new Uint8Array(Buffer.from('000000000000000000000000000000000000000000746573746e65745f303636', 'hex')) },
    ])

    // await createAlgoAppTx('addTokenPair', [790, 2147483931, Buffer.from('00000000009f973d', 'hex'),2153201998,Buffer.from('7ff465746e4f47e1cbbb80c864cd7de9f13337fe', 'hex')], 
    //     [{appIndex: bridge_id, name: util.getPrefixKey("mapTokenPairInfo", 790)}])
}


main()
