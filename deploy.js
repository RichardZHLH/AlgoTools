const algosdk = require('algosdk')
const fs=require('fs')
const util = require('./util.js')


const testnet=1
let bridge_id
let groupApprove_id
let groupApprove_Foundation, oracleAdmin, updateOwner,feeProxy, algodClient
if(testnet){
    groupApprove_Foundation = 'LZD7VYWKMLMFWKWQ6TSXKECSRZYKVEFHXMKHPVOSSOUO63EDRLHWIAL3I4'
    oracleAdmin = 'WBKFZYUAYUXA55ENGAASBFZ2YZ43562VEUKX4PZDA45PVNA76EZZLWLZPU'
    updateOwner = 'F5H5KOYIH4JFN64UMNTLJ22RR7BRLT7PL3FVZH25ALLJIPK5F5MMPTRGEQ'
    feeProxy = 'SRYZYNXKS53PYFKRS4H676NSICC4LPTECCFT5WR3SKEOXLQQNGT3TW7OLA'
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else{

}



let acct = algosdk.mnemonicToSecretKey(process.env.MN)
console.log("acct:", acct.addr)

function num_extra_program_pages(approval, clear){
    const APP_PAGE_MAX_SIZE = 2048
    let extra = parseInt((approval.length+clear.length)/APP_PAGE_MAX_SIZE)
    return extra
}

async function deployContract(artiname) {    
    const appState = require('./'+artiname+'/application.json').state
    const tealSourcea = fs.readFileSync('./'+artiname+'/approval.teal', 'utf8');
    const compiledTeala = await algodClient.compile(tealSourcea).do();
    const tealSourcec = fs.readFileSync('./'+artiname+'/clear.teal', 'utf8');
    const compiledTealc = await algodClient.compile(tealSourcec).do();
    const params = await algodClient.getTransactionParams().do();
    const approvalProgram = new Uint8Array(Buffer.from(compiledTeala.result, 'base64'))
    const clearProgram = new Uint8Array(Buffer.from(compiledTealc.result, 'base64'))
    const txn = algosdk.makeApplicationCreateTxnFromObject({
        from: acct.addr,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        suggestedParams: params,
        extraPages: num_extra_program_pages(approvalProgram,clearProgram),
        numGlobalByteSlices:appState.global.num_byte_slices+3, // for update later
        numGlobalInts:appState.global.num_uints+3,
        numLocalByteSlices:appState.local.num_byte_slices,
        numLocalInts:appState.local.num_uints,
    });
    const signedTxn = txn.signTxn(acct.sk);
    const {txId} = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('Deploy contract txId:', txId);

    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    let appId = result['application-index']
    console.log('application index:', appId);
    return appId
}


async function fundSmartContract(appID, fundingAmount) {
    try {
        const params = await algodClient.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: acct.addr,
            to: algosdk.getApplicationAddress(appID),
            amount: fundingAmount,
            suggestedParams: params
        });

        const signedTxn = txn.signTxn(acct.sk);
        const sendTx = await algodClient.sendRawTransaction(signedTxn).do();
        await algosdk.waitForConfirmation(algodClient, sendTx.txId, 4);
    } catch (err) {
        console.error('err:', err);
    }
}


async function initGroupApprove() {
    const abi = require('./artifacts_groupApprove/contract.json')

    const methodName = 'initialize'
    const args = [groupApprove_Foundation, bridge_id]

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName(methodName);
  
    let suggestedParams = await algodClient.getTransactionParams().do(); 
   
    let appArgs = [method.getSelector()]
    method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
  
    const options = {
        from: acct.addr,
        suggestedParams: suggestedParams,
        appIndex: groupApprove_id,
        appArgs:appArgs,
    }

    const unsignedTx = algosdk.makeApplicationCallTxnFromObject(options);
    const signedTxn = unsignedTx.signTxn(acct.sk);

    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);
}


async function initBridge() {
    const abi = require('./artifacts_cross/contract.json')
    const methodName = 'initialize'
    const args = [acct.addr, updateOwner, acct.addr, feeProxy, oracleAdmin]

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName(methodName);
  
    let suggestedParams = await algodClient.getTransactionParams().do(); 
   
    let appArgs = [method.getSelector()]
    method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
  
    const options = {
        from: acct.addr,
        suggestedParams: suggestedParams,
        appIndex: bridge_id,
        appArgs:appArgs,
        boxes:[{appIndex: bridge_id, name: util.getPrefixAddrKey('mapAdmin', acct.addr)}]
    }

    const unsignedTx = algosdk.makeApplicationCallTxnFromObject(options);
    const signedTxn = unsignedTx.signTxn(acct.sk);
    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);
}

async function main() {  
    if(!bridge_id) {
        bridge_id = await deployContract('artifacts_cross')
        await fundSmartContract(bridge_id, 1000000)
        await initBridge()
    }

    groupApprove_id = await deployContract('artifacts_groupApprove')
    await fundSmartContract(groupApprove_id, 1000000)
    await initGroupApprove()
}
main()