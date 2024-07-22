const algosdk = require('algosdk')
const fs = require('fs')
const abi = require('./artifacts_groupApprove/contract.json')
const util = require('./util.js')
const signlib = require('./signlib.js')

// this script execute proposol simulate agent smg.


const testnet=1
let bridge_id,groupApprove_id,algodClient
if(testnet){
    groupApprove_id = cfg['testnet'].groupApprove_id
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else{

}

const chainAlgo =  2147483931
const smgID=Buffer.from('000000000000000000000000000000000000000000746573746e65745f303631', 'hex')


async function main() {    
    let acct = algosdk.mnemonicToSecretKey(process.env.MN)
    console.log("acct:", acct.addr)

    let boxesj = JSON.parse(fs.readFileSync('./boxes.json'))
    let proposalIdItem =     boxesj.find(item=>item.appIndex == groupApprove_id && item.name.startsWith('000f6d61705461736b'))
    let proposalId = parseInt(Buffer.from(proposalIdItem.name.slice(proposalIdItem.name.length-16),'hex').readBigUInt64BE().toString())
    console.log("proposalId:", proposalId)
    

    let boxes = []
    boxes.push({appIndex: bridge_id, name:new Uint8Array(smgID)})
    boxesj.map(item=>{boxes.push({appIndex:parseInt(item.appIndex), name: new Uint8Array(Buffer.from(item.name,'hex'))})})

    console.log("boxes:", boxes)


    let rs = signlib.getProposolSign(proposalId, chainAlgo)
    console.log("rs:", rs)
    

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName('approveAndExecute');
    console.log("method:", method)
    
    let r = Buffer.from(rs.r, 'hex')
    let s = Buffer.from(rs.s, 'hex')

    const args = [proposalId, smgID, r, s]
    let appArgs = [method.getSelector()]

    method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
    console.log("appArgs:", appArgs)
    

    const suggestedParams = await algodClient.getTransactionParams().do(); 
    console.log("suggestedParams:", suggestedParams)

    suggestedParams.fee = suggestedParams.minFee*20
    suggestedParams.flatFee = true
    console.log("suggestedParams:", suggestedParams)

   
    const options = {
        from: acct.addr,
        suggestedParams: suggestedParams,
        appIndex: groupApprove_id,
        appArgs:appArgs,
        foreignApps:[bridge_id],
        boxes:boxes
    }
    const unsignedTx = algosdk.makeApplicationCallTxnFromObject(options);
    console.log("unsignedTx:", unsignedTx)
    
   
    const signedTxn = unsignedTx.signTxn(acct.sk);
    // console.log("signedTxn:", signedTxn)

    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log('Transaction Information:', result);
}


main()
