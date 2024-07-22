const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const algosdk = require('algosdk')
const abi = require('./artifacts_groupApprove/contract.json')
const fs=require('fs')
const util = require('./util.js')
const cfg = require('./config.js')

const argv = yargs(hideBin(process.argv))
    .parserConfiguration({
        'parse-numbers': false // 禁用数字解析
    })
    .argv;


const chainAlgo =  2147483931

const testnet=1
let bridge_id,groupApprove_id,algodClient
let delayRound, foundation
if(testnet){
    groupApprove_id = cfg['testnet'].groupApprove_id
    bridge_id = cfg['testnet'].bridge_id
    algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
    delayRound = 10
    foundation = 'LZD7VYWKMLMFWKWQ6TSXKECSRZYKVEFHXMKHPVOSSOUO63EDRLHWIAL3I4'
  }else{
    delayRound = 30000
    foundation = ''
}





let boxes = []

// 定义一个函数，用于逐步询问用户问题
function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}
async function createAlgoTx(proposolType, encodedata) {
  let algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')

  const contract = new algosdk.ABIContract(abi);
  const method = contract.getMethodByName('proposal');

  // TODO fee, round should get from chain.
  let suggestedParams = await algodClient.getTransactionParams().do(); 
  suggestedParams.firstRound += delayRound
  suggestedParams.lastRound += delayRound 


  let args
  if(proposolType == 9) {
    args = [chainAlgo, groupApprove_id, proposolType, encodedata]
  } else {
    args = [chainAlgo, bridge_id, proposolType, encodedata]
  }
  let appArgs = [method.getSelector()]

  method.args.map((arg, index) => appArgs.push(arg.type.encode(args[index])));
  // console.log("appArgs:", appArgs)


  let taskId = await util.getGlobalState(groupApprove_id, 'taskCount')
  if(!taskId) taskId = 0
  const options = {
      from: foundation,
      suggestedParams: suggestedParams,
      appIndex: groupApprove_id,
      appArgs:appArgs,
      foreignApps:[bridge_id],
      boxes:[ {appIndex: groupApprove_id, name: util.getPrefixKey('mapTask', taskId)} ]
  }
  boxes.push({appIndex: groupApprove_id, name: Buffer.from(util.getPrefixKey('mapTask', taskId)).toString('hex')})
  const ptxn = algosdk.makeApplicationCallTxnFromObject(options);
  let stx =  Buffer.from(ptxn.toByte()).toString('hex')
  // console.log("transaction:", stx)

  fs.writeFileSync('./Transaction.json', stx)

  
  fs.writeFileSync('./boxes.json', JSON.stringify(boxes))
  // let boxesa = JSON.parse(fs.readFileSync('./boxes.json'))
  // console.log("boxesa:", boxesa)
}
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  let encodeArgv
  if(!argv.proposolType) {
    console.log("please input your proposol type:")
    console.log(`      1: add admin
      2: remove admin
      3: transfer owner
      4: set halt
      5: set smg fee proxy
      6: add token pair
      7: remove token pair
      8: update token pair
      9: tranfer foundation
      10: transfer update owner
      11: transfer oracle admin
    `)
    argv.proposolType = await askQuestion(rl, 'proposol type: ');
  }
  // console.log("argv.proposolType:", argv.proposolType)
  argv.proposolType = parseInt(argv.proposolType)
  switch(argv.proposolType) {
    case 1:
      if(!argv.adminAddr) {
        argv.adminAddr = await askQuestion(rl, 'Input new admin address: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.adminAddr)
      boxes.push({appIndex: bridge_id, name:Buffer.from(util.getPrefixAddrKey("mapAdmin", argv.adminAddr)).toString('hex')})
      break
    case 2:
      if(!argv.adminAddr) {
        argv.adminAddr = await askQuestion(rl, 'Input want to removed admin address: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.adminAddr)      
      boxes.push({appIndex: bridge_id, name:Buffer.from(util.getPrefixAddrKey("mapAdmin", argv.adminAddr)).toString('hex')})
      break
    case 3:
      if(!argv.ownerAddr) {
        argv.ownerAddr = await askQuestion(rl, 'Input new owner address: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.ownerAddr)      
      break     
    case 4:
      if(!argv.halt) {
        argv.halt = await askQuestion(rl, 'Input new halt status: ');
      }
      codec = algosdk.ABIType.from('uint64')
      encodeArgv = codec.encode(argv.halt)      
      break        
    case 5:
      if(!argv.feeProxy) {
        argv.feeProxy = await askQuestion(rl, 'Input new smg fee proxy: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.feeProxy)
      break  
    case 6:
      if(!argv.tokenPairId){
        argv.tokenPairId = await askQuestion(rl, 'Input token pair id: ');
        argv.sourceChain = await askQuestion(rl, 'Input source chain: ');
        argv.sourceAccount = await askQuestion(rl, 'Input source Account: ');
        argv.destChain = await askQuestion(rl, 'Input destination chain: ');
        argv.destAccount = await askQuestion(rl, 'Input destination Account: ');
      }
      argv.tokenPairId = parseInt(argv.tokenPairId)
      argv.sourceChain = parseInt(argv.sourceChain)
      argv.destChain = parseInt(argv.destChain)
      if(argv.sourceAccount.startsWith('0x')) {
        argv.sourceAccount = argv.sourceAccount.slice(2)
      }
      if(argv.destAccount.startsWith('0x')) {
        argv.destAccount = argv.destAccount.slice(2)
      }
      codec = algosdk.ABIType.from("(uint64,uint64,byte[],uint64,byte[])")
      encodeArgv = codec.encode([argv.tokenPairId, argv.sourceChain, Buffer.from(argv.sourceAccount, 'hex'), argv.destChain, Buffer.from(argv.destAccount, 'hex')])
      boxes.push({appIndex: bridge_id, name:Buffer.from(util.getPrefixKey("mapTokenPairInfo", argv.tokenPairId)).toString('hex')})
      break
    case 7:
      if(!argv.tokenPairId){
        argv.tokenPairId = await askQuestion(rl, 'Input token pair id: ');
      }
      argv.tokenPairId = parseInt(argv.tokenPairId)
      codec = algosdk.ABIType.from('uint64')
      encodeArgv = codec.encode(argv.tokenPairId)    
      boxes.push({appIndex: bridge_id, name:Buffer.from(util.getPrefixKey("mapTokenPairInfo", argv.tokenPairId)).toString('hex')})
      break
    case 8:
      if(!argv.tokenPairId){
        argv.tokenPairId = await askQuestion(rl, 'Input token pair id: ');
        argv.sourceChain = await askQuestion(rl, 'Input source chain: ');
        argv.sourceAccount = await askQuestion(rl, 'Input source Account: ');
        argv.destChain = await askQuestion(rl, 'Input destination chain: ');
        argv.destAccount = await askQuestion(rl, 'Input destination Account: ');
      }
      argv.tokenPairId = parseInt(argv.tokenPairId)
      argv.sourceChain = parseInt(argv.sourceChain)
      argv.destChain = parseInt(argv.destChain)
      if(argv.sourceAccount.startsWith('0x')) {
        argv.sourceAccount = argv.sourceAccount.slice(2)
      }
      if(argv.destAccount.startsWith('0x')) {
        argv.destAccount = argv.destAccount.slice(2)
      }
      codec = algosdk.ABIType.from("(uint64,uint64,byte[],uint64,byte[])")
      encodeArgv = codec.encode([argv.tokenPairId, argv.sourceChain, Buffer.from(argv.sourceAccount, 'hex'), argv.destChain, Buffer.from(argv.destAccount, 'hex')])
      boxes.push({appIndex: bridge_id, name:Buffer.from(util.getPrefixKey("mapTokenPairInfo", argv.tokenPairId)).toString('hex')})
      break 
    case 9:
      if(!argv.foundation) {
        argv.foundation = await askQuestion(rl, 'Input new foundation address: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.foundation)
      break  
    case 10:
      if(!argv.updateOwner) {
        argv.updateOwner = await askQuestion(rl, 'Input new update owner: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.updateOwner)
      break  
    case 11:
      if(!argv.oracleAdmin) {
        argv.oracleAdmin = await askQuestion(rl, 'Input new oracle admin: ');
      }
      codec = algosdk.ABIType.from('address')
      encodeArgv = codec.encode(argv.oracleAdmin)
      break        
    default:
      console.log("unknow type.")
      return
  }
  rl.close();
  await createAlgoTx(argv.proposolType, encodeArgv)
}

// 调用主函数
main();