const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const algosdk = require('algosdk')
const cfg = require('./config.js')



const testnet = 1
let bridge_id, algodClient
if(testnet) {
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else {

}

const assetIndex = 705332827
let acct = algosdk.mnemonicToSecretKey(process.env.MN)
console.log("acct:", acct.addr)

async function main() {   
    console.log("bridge addr:", algosdk.getApplicationAddress(bridge_id))
    const suggestedParams = await algodClient.getTransactionParams().do();


    const unsignedTx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: acct.addr,
        to: algosdk.getApplicationAddress(bridge_id),
        suggestedParams,
        assetIndex,
        amount: 1000000000000,
    });
      
    const signedTxn = unsignedTx.signTxn(acct.sk);
    const result = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    let receipt = await algosdk.waitForConfirmation(algodClient, result.txId, 4);

    console.log("Asset transfered:", receipt);
}


main()
