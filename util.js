const algosdk = require('algosdk')

// 解码全局状态
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

function getPrefixKey(prefix, id) {
  let allLength = 8 + prefix.length
  let b = Buffer.alloc(2+allLength)
  b.writeUint16BE(allLength, 0)
  b.write(prefix,2)
  b.writeBigUInt64BE(BigInt(id), 2+prefix.length)
  return  new Uint8Array(b)
}

function getPrefixAddrKey(prefix, addr){
  let allLength = 32 + prefix.length
  let b = Buffer.alloc(2+allLength)
  b.writeUint16BE(allLength, 0)
  b.write(prefix,2)
  let addb = Buffer.from(algosdk.decodeAddress(addr).publicKey)
  addb.copy(b, 2+prefix.length)
  return  new Uint8Array(b)
}

async function getGlobalState(appId, key) {
  let algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')
  const appInfo = await algodClient.getApplicationByID(appId).do();
  const globalState = appInfo['params']['global-state'];
  const decodedState = decodeState(globalState);
  let value = decodedState[key]
  return value
}

module.exports = {
  getGlobalState,getPrefixKey,decodeState,getPrefixAddrKey,
}