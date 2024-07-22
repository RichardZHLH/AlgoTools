const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const algosdk = require('algosdk')
const fs = require('fs')
const abi = require('./artifacts_cross/contract.json')
const util = require('./util.js')
const cfg = require('./config.js')

//          after configure contract, use this script to transfer owner to groupApprove

const testnet = 1
let bridge_id, algodClient
if(testnet) {
    groupApprove_id = cfg['testnet'].groupApprove_id
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
    await createAlgoAppTx('transferOwner', [algosdk.getApplicationAddress(groupApprove_id)], [])
}


main()
