const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const algosdk = require('algosdk')
const fs = require('fs')
const abi = require('./artifacts_cross/contract.json')
const util = require('./util.js')
const cfg = require('./config.js')




const testnet = 1
let bridge_id, algodClient
if(testnet) {
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
}else {

}





const argv = yargs(hideBin(process.argv))
    .parserConfiguration({
        'parse-numbers': false 
    })
    .argv;

function askQuestion(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}


async function createAlgoAdminTx(methodName, args, box, foreignAssets=[]) {
    let acct = algosdk.mnemonicToSecretKey(process.env.MN)
    console.log("acct:", acct.addr)
    const contract = new algosdk.ABIContract(abi);
    const method = contract.getMethodByName(methodName);
  
    let suggestedParams = await algodClient.getTransactionParams().do(); 
   
    let appArgs = [method.getSelector()]
    method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
    // console.log("appArgs:", appArgs)
  
    box.push({appIndex: bridge_id, name: util.getPrefixAddrKey('mapAdmin', acct.addr)})
    const options = {
        from: acct.addr,
        suggestedParams: suggestedParams,
        appIndex: bridge_id,
        appArgs:appArgs,
        foreignAssets,
        boxes:box
    }




    console.log("options:", options)
    const unsignedTx = algosdk.makeApplicationCallTxnFromObject(options);
    console.log("unsignedTx:", unsignedTx)
    const signedTxn = unsignedTx.signTxn(acct.sk);

    const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log('Transaction Information:', result);
  }



async function main() {   
    let encodeArgv

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    if(!argv.configType) {
        console.log(
`please input your config type:      
1: config tokenPair Fee
2: config chain Pair Fee
3: opt in a Asset`)
        argv.configType = await askQuestion(rl, 'config type: ');
    }

    argv.configType = Number(argv.configType)
    switch(argv.configType) {
        case 1:
            if(!argv.tokenPairId) {
                argv.tokenPairId = await askQuestion(rl, 'Input token pair ID: ');
            }
            if(!argv.fee) {
                argv.fee = await askQuestion(rl, 'Input token pair Fee: ');
            }
            argv.tokenPairId = parseInt(argv.tokenPairId)
            argv.fee = parseInt(argv.fee)
            createAlgoAdminTx('setTokenPairFee', [argv.tokenPairId, argv.fee], [{appIndex: bridge_id, name: util.getPrefixKey('mapTokenPairContractFee', argv.tokenPairId)}])
            break
        case 2:    
            if(!argv.fromChain) {
                argv.fromChain = await askQuestion(rl, 'Input from chain ID: ');
            }
            if(!argv.toChain) {
                argv.toChain = await askQuestion(rl, 'Input to chain ID: ');
            }
            if(!argv.contractFee) {
                argv.contractFee = await askQuestion(rl, 'Input contract Fee: ');
            }
            if(!argv.agentFee) {
                argv.agentFee = await askQuestion(rl, 'Input agent Fee: ');
            }
            argv.contractFee = parseInt(argv.contractFee)
            argv.fromChain = parseInt(argv.fromChain)
            argv.toChain = parseInt(argv.toChain)
            argv.agentFee = parseInt(argv.agentFee)
            createAlgoAdminTx('setFee', [argv.fromChain, argv.toChain, argv.contractFee, argv.agentFee], [
                {appIndex: bridge_id, name: util.getPrefixKey('mapContractFee', BigInt(argv.fromChain)* BigInt(2**32) + BigInt(argv.toChain))},
                {appIndex: bridge_id, name: util.getPrefixKey('mapAgentFee', BigInt(argv.fromChain)* BigInt(2**32) + BigInt(argv.toChain))},
            ])
            break
        case 3:
            if(!argv.assetId) {
                argv.assetId = await askQuestion(rl, 'Input optin Asset ID: ');
            }
            argv.assetId = parseInt(argv.assetId)
            createAlgoAdminTx('opt_in_token_id', [argv.assetId], [], [argv.assetId])
            break

    }
    rl.close();
}


main()
