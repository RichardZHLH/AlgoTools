const algosdk = require('algosdk')
const fs=require('fs')
const cfg = require('./config.js')

const testnet = 1
let bridge_id, algodClient,updateOwner
if(testnet) {
    bridge_id = cfg['testnet'].bridge_id
    updateOwner = 'WBKFZYUAYUXA55ENGAASBFZ2YZ43562VEUKX4PZDA45PVNA76EZZLWLZPU'
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else {

}



async function updateContract(artiname, app_id) {    
    const abi = require('./'+artiname+'/contract.json')

    const methodName = 'update'

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName(methodName);
    let appArgs = [method.getSelector()]
    const tealSourcea = fs.readFileSync('./'+artiname+'/approval.teal', 'utf8');
    const compiledTeala = await algodClient.compile(tealSourcea).do();
    const tealSourcec = fs.readFileSync('./'+artiname+'/clear.teal', 'utf8');
    const compiledTealc = await algodClient.compile(tealSourcec).do();
    const params = await algodClient.getTransactionParams().do();
    const approvalProgram = new Uint8Array(Buffer.from(compiledTeala.result, 'base64'))
    const clearProgram = new Uint8Array(Buffer.from(compiledTealc.result, 'base64'))
    const txn = algosdk.makeApplicationUpdateTxnFromObject({
        from: updateOwner,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        appIndex: app_id,
        suggestedParams: params,
        appArgs:appArgs,
    });
    let stx =  Buffer.from(txn.toByte()).toString('hex')
    fs.writeFileSync('./Transaction.json', stx)
}

async function main() {  
    await updateContract('artifacts_cross', bridge_id)
}
main()
