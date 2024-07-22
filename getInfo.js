const algosdk = require('algosdk')
const fs = require('fs')
const util = require('./util.js')
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
function decodeTokenPair(data) {
    let codec = algosdk.ABIType.from("(uint64,uint64,byte[],uint64,byte[])")
    let paira = codec.decode(data)
    let pairo = {}
    pairo.id = paira[0].toString()
    pairo.fromChain = paira[1].toString()
    pairo.fromAccount = Buffer.from(paira[2]).toString('hex')
    pairo.toChainID = paira[3].toString()
    pairo.toAccount = Buffer.from(paira[4]).toString('hex')
    return pairo
}

function decodeSmgCfg(data) {
    let codec = algosdk.ABIType.from("(byte[64],uint64,uint64,uint8)")
    let cfga = codec.decode(data)
    let cfgo = {}
    cfgo.id = Buffer.from(cfga[0]).toString('hex')
    cfgo.startTime = cfga[1].toString()
    cfgo.endTime = cfga[2].toString()
    cfgo.status = cfga[3].toString()
    return cfgo
}

function decodeTask(data) {
    let codec = algosdk.ABIType.from("(uint64,uint64,byte[],uint8)")
    let cfga = codec.decode(data)
    let cfgo = {}
    cfgo.to = Number(cfga[0])
    cfgo.proposalType = Number(cfga[1])
    cfgo.data = Buffer.from(cfga[2]).toString('hex')
    cfgo.executed = Number(cfga[3])
    return cfgo
}



async function main() {    
    const appInfo = await algodClient.getApplicationByID(bridge_id).do();
    const globalState = appInfo['params']['global-state'];
    const decodedState = util.decodeState(globalState);
    for(let key of Object.keys(decodedState)) {
        switch(key) {
            case "owner":
                decodedState.owner = algosdk.encodeAddress(decodedState[key])
                break
            case "feeProxy":
                decodedState.feeProxy = algosdk.encodeAddress(decodedState[key])
                break
            case "oracleAdmin":
                decodedState.oracleAdmin = algosdk.encodeAddress(decodedState[key])
                break                
            case "updateOwner":
                decodedState.updateOwner = algosdk.encodeAddress(decodedState[key])
                break                                
        }
    }
    console.log("Bridge Global State:", decodedState)

    let boxes = await algodClient.getApplicationBoxes(bridge_id).do()
    for(let item of boxes.boxes) {
        let v = await algodClient.getApplicationBoxByName(bridge_id, item.name).do()
        // console.log("v:", Buffer.from(v.value).toString('hex'))

        let key = Buffer.from(item.name).toString('hex')
        // console.log("key:", key)
        if(key.indexOf(Buffer.from('mapTokenPairContractFee').toString('hex')) != -1) {
            console.log("mapTokenPairContractFee:", Buffer.from(item.name).readBigUInt64BE(2+('mapTokenPairContractFee').length).toString(), Buffer.from(v.value).readBigUInt64BE(0).toString())
        } else if(key.indexOf(Buffer.from('mapContractFee').toString('hex')) != -1) {
            let fromChain = Buffer.from(item.name).readUInt32BE(2+('mapContractFee').length)
            let toChain = Buffer.from(item.name).readUInt32BE(2+('mapContractFee').length+4)
            console.log("mapContractFee:", fromChain, toChain, Buffer.from(v.value).readBigUInt64BE(0).toString())
        } else if(key.indexOf(Buffer.from('mapAgentFee').toString('hex')) != -1) {
            let fromChain = Buffer.from(item.name).readUInt32BE(2+('mapAgentFee').length)
            let toChain = Buffer.from(item.name).readUInt32BE(2+('mapAgentFee').length+4)
            console.log("mapAgentFee:", fromChain, toChain, Buffer.from(v.value).readBigUInt64BE(0).toString())
        } else if(key.indexOf(Buffer.from('mapAdmin').toString('hex')) != -1) {
            console.log("mapAdmin:", algosdk.encodeAddress(Buffer.from(item.name).subarray(2+('mapAdmin').length)), Buffer.from(v.value).toString('hex') )
        } else if(key.indexOf(Buffer.from('mapTokenPairInfo').toString('hex')) != -1) {
            console.log("mapTokenPairInfo:", decodeTokenPair(v.value))


        } else if(key.startsWith('000000000000000000')){ // storeman group
            console.log("storeman group:", Buffer.from(item.name).toString(),":", decodeSmgCfg(v.value))
        } else { // unique ID
            if(Buffer.from(item.name).length != 32) {
                //console.log("unknown key, ignore:", Buffer.from(item.name).toString())
                continue
            }
            console.log("Unique tx:", key, Buffer.from(v.value).toString('hex'))
        }

    }

    const gpappInfo = await algodClient.getApplicationByID(groupApprove_id).do();
    const gpglobalState = gpappInfo['params']['global-state'];
    const gpdecodedState = util.decodeState(gpglobalState);
    for(let key of Object.keys(gpdecodedState)) {
        switch(key) {
            case "foundation":
                gpdecodedState.foundation = algosdk.encodeAddress(gpdecodedState[key])
                break                           
        }
    }
    console.log("GroupApprove Global State:", gpdecodedState)
    return // ignore tasks
    boxes = await algodClient.getApplicationBoxes(groupApprove_id).do()
    for(let item of boxes.boxes) {
        let v = await algodClient.getApplicationBoxByName(groupApprove_id, item.name).do()
        // console.log("v:", Buffer.from(v.value).toString('hex'))

        let key = Buffer.from(item.name).toString('hex')
        // console.log("key:", key)
        if(key.indexOf(Buffer.from('mapTask').toString('hex')) != -1) {
            console.log("mapTask:", Buffer.from(item.name).readBigUInt64BE(2+('mapTask').length).toString(), decodeTask(v.value))
        } else {
            console.log("unknown key:", Buffer.from(item.name).toString())
        }

    }
    return 


}


main()
