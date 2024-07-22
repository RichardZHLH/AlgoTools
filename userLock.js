const algosdk = require('algosdk')
const abi = require('./artifacts_cross/contract.json')
const cfg = require('./config.js')

const testnet=1
let bridge_id,groupApprove_id,algodClient
if(testnet){
    groupApprove_id = cfg['testnet'].groupApprove_id
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else{

}



function getPrefixKey(prefix, id) {
    let allLength = 8 + prefix.length
    let b = Buffer.alloc(2+allLength)
    b.writeUint16BE(allLength, 0)
    b.write(prefix,2)
    b.writeBigUInt64BE(BigInt(id), 2+prefix.length)
    return  new Uint8Array(b)
}


const chainAlgo =  2147483931n
const chainWan  = 2153201998n
const nativeAssetID = 10458941 // this is a native token, need cross to wanchain.

const bridge_addr = algosdk.getApplicationAddress(bridge_id)
const tokenPairIdALGO = 770
const tokenPairIdUSDC = 790
const smgID=Buffer.from('000000000000000000000000000000000000000000746573746e65745f303636', 'hex')
const userAccount="0xF1cF205442Bea02E51e2c68ff4CC698E5879663c"


async function userlockCoin() {    
    let senderAccount = algosdk.mnemonicToSecretKey(process.env.MN)
    
    const composer = new algosdk.AtomicTransactionComposer();

    const suggestedParams = await algodClient.getTransactionParams().do(); 

    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: bridge_addr,
        amount: 301000, 
        suggestedParams: suggestedParams,
    });

    composer.addTransaction({
        txn: paymentTxn,
        signer: algosdk.makeBasicAccountTransactionSigner(senderAccount),
    });

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName('userLock');

    composer.addMethodCall({
        appID: bridge_id,
        method: method,
        methodArgs: [smgID, tokenPairIdALGO, userAccount, 1000],
        sender: senderAccount.addr,
        suggestedParams: suggestedParams,
        signer: algosdk.makeBasicAccountTransactionSigner(senderAccount),
        boxes:[
            {appIndex: bridge_id, name: getPrefixKey("mapTokenPairContractFee", tokenPairIdALGO)},
            {appIndex: bridge_id, name: getPrefixKey("mapTokenPairInfo", tokenPairIdALGO)},
            {appIndex: bridge_id, name: getPrefixKey("mapContractFee", chainAlgo*2n**32n+chainWan)},
            {appIndex: bridge_id, name: getPrefixKey("mapContractFee", chainAlgo*2n**32n+0n)},
        ]
    });
    
    const result = await composer.execute(algodClient, 2);
    console.log("tx result:",result);
}



async function userlockToken() {    
    let senderAccount = algosdk.mnemonicToSecretKey(process.env.MN)
    
    const composer = new algosdk.AtomicTransactionComposer();

    const suggestedParams = await algodClient.getTransactionParams().do(); 

    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: bridge_addr,
        amount: 200000, 
        suggestedParams: suggestedParams,
    });

    composer.addTransaction({
        txn: paymentTxn,
        signer: algosdk.makeBasicAccountTransactionSigner(senderAccount),
    });

    const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: bridge_addr,
        assetIndex: nativeAssetID,
        amount: 10000000, 
        suggestedParams: suggestedParams,
    });

    composer.addTransaction({
        txn: assetTxn,
        signer: algosdk.makeBasicAccountTransactionSigner(senderAccount),
    });

    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName('userLock');

    composer.addMethodCall({
        appID: bridge_id,
        method: method,
        methodArgs: [smgID, tokenPairIdUSDC, userAccount, 10000000],  
        sender: senderAccount.addr,
        suggestedParams: suggestedParams,
        signer: algosdk.makeBasicAccountTransactionSigner(senderAccount),
        boxes:[
            {appIndex: bridge_id, name: getPrefixKey("mapTokenPairContractFee", tokenPairIdUSDC)},
            {appIndex: bridge_id, name: getPrefixKey("mapTokenPairInfo", tokenPairIdUSDC)},
            {appIndex: bridge_id, name: getPrefixKey("mapContractFee", chainAlgo*2n**32n+chainWan)},
            {appIndex: bridge_id, name: getPrefixKey("mapContractFee", chainAlgo*2n**32n+0n)},
        ]
    });
    
    const result = await composer.execute(algodClient, 2);
    console.log("tx result:",result);
}


function decodeState(stateArray) {
    let state = {};
    for (let item of stateArray) {
        let key = Buffer.from(item.key, 'base64').toString('utf8');
        let value = item.value;
        if (value.type === 2) {
            // Uint
            state[key] = value.uint;
        } else if (value.type === 1) {
            // Bytes
            state[key] = Buffer.from(value.bytes, 'base64');
        }
    }
    return state;
}




async function main() {
    // const appInfo = await algodClient.getApplicationByID(bridge_id).do();
    // const globalState = appInfo['params']['global-state'];
    // console.log("globalState:", globalState)
    // const decodedState = decodeState(globalState);
    // console.log("decodedState:", decodedState)
    // let feeProxyb = decodedState['feeProxy']
    // let feeProxyAddr = algosdk.encodeAddress(feeProxyb)
    // console.log("feeProxyAddr:", feeProxyAddr)
    await userlockToken()
    return
}

main()