const algosdk = require('algosdk')
const fs = require('fs')

const sleep = (ms)=>new Promise(resolve=>setTimeout(resolve,ms))

const testnet = 1
let algodClient
if(testnet) {
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else {

}


async function main() {    

    let signedTxn = fs.readFileSync('./signedTransaction.json','utf-8').trim()
    signedTxn = Buffer.from(signedTxn, 'hex')
   
    let signedTxnObj = algosdk.decodeSignedTransaction(Buffer.from(signedTxn, 'hex'))
    console.log("signedTxnObj:", signedTxnObj)

    let status = await algodClient.status().do();
    let lastRound =  status['last-round'];
    console.log("lastRound:", lastRound)

    while(lastRound < signedTxnObj.txn.firstRound) {
        await sleep(1000 * 10)
        status = await algodClient.status().do();
        lastRound =  status['last-round'];
        console.log("lastRound:", lastRound)
    }

    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("txId:", txId);
}


main()