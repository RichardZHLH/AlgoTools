

const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const Web3 = require('web3')
const algosdk = require('algosdk')
const keccak256 = require('keccak256')




let web3 = new Web3()


function solidityKeccak256(types, params) {
  if (types.length != params.length) {
      throw new Error("solidityKeccak256 invalid length");
  }
  const message =  Buffer.from(web3.utils.hexToBytes(web3.utils.encodePacked(...types.map((type, index) => ({
      type:type, value: web3.eth.abi.formatParam(type, (Array.isArray(params[index]) || params[index] instanceof Uint8Array) ? Buffer.from(params[index]) : params[index])
  })))));
  // console.log("message:", message.toString('hex'))
  // const message =  Buffer.from(web3.utils.hexToBytes(web3.utils.encodePacked(...types.map((type, index) => ({type:type, value: params[index]})))));
  // == const hash = keccak256(message);
  const hash = web3.utils.keccak256(message);
  return hash.startsWith("0x") ? hash : `0x${hash}`;
}


function sign(m, x, k) {
  var publicKey = secp256k1.publicKeyCreate(x);

  // R = G * k
  if(!k){
    k = randomBytes(32);
  }
   
  var R = secp256k1.publicKeyCreate(k);
  // console.log("----------------verify para k:", web3.utils.bytesToHex(k))

  // e = h(address(R) || compressed pubkey || m)
  var e = challenge(R, m, publicKey);
  // console.log("e:", e)
  // xe = x * e
  var xe = secp256k1.privateKeyTweakMul(x, e);
  // console.log("xe:", xe)

  // s = k + xe
  var s = secp256k1.privateKeyTweakAdd(k, xe);

  // console.log("k:", k, "length:", R.length)
  // // console.log("R hex:", web3.utils.bytesToHex(R))
  // console.log("R:", R, "length:", R.length)
  // console.log("R hex:", web3.utils.bytesToHex(R))
  // console.log("s:", s, "length:", s.length)
  // console.log("s hex:", web3.utils.bytesToHex(s))
  // console.log("e:", e, "length:", e.length)
  // console.log("e hex:", web3.utils.bytesToHex(e))

  return {R, s, e};
}

function challenge(R, m, publicKey) {
  // convert R to address
  // see https://github.com/ethereum/go-ethereum/blob/eb948962704397bb861fd4c0591b5056456edd4d/crypto/crypto.go#L275
  var R_uncomp = secp256k1.publicKeyConvert(R, false);
  var R_addr = web3.utils.bytesToHex(web3.utils.hexToBytes(web3.utils.keccak256(web3.utils.bytesToHex(R_uncomp.slice(1, 65)))).slice(12, 32));
  // console.log("R:", web3.utils.bytesToHex(R));
  // console.log("R_uncomp:", web3.utils.bytesToHex(R_uncomp));
  // console.log("R_addr:", R_addr)

  // e = keccak256(address(R) || compressed publicKey || m)
  var e = Uint8Array.from(web3.utils.hexToBytes(solidityKeccak256(
    ["address", "uint8", "bytes32", "bytes32"],
    [R_addr, publicKey[0] - 2 + 27, publicKey.slice(1, 33), m])))

  return e;
}



function getProposolSign(proposalId, CurrentChainID) {
  let codec = algosdk.ABIType.from("(uint64,uint64)")
  let alldata = codec.encode([proposalId, CurrentChainID])
  // console.log("alldata:", alldata)  
  let m = keccak256(Buffer.from(alldata))
  // console.log("m:", m.toString('hex'))
  return schnorr_sign(m)
}

function schnorr_sign(m) {
  let privKey = '0x16eea2f8dea9469e22fd75cd227ff4b81a34c14afc69b92636a88b38f1ac2a3c'
  // do {
  //   privKey = randomBytes(32)
  // } while (!secp256k1.privateKeyVerify(privKey))

  var publicKeyC = secp256k1.publicKeyCreate(Buffer.from(privKey.slice(2), 'hex'), true);
  var publicKey = secp256k1.publicKeyCreate(Buffer.from(privKey.slice(2), 'hex'), false);
  // console.log("publicKey:", web3.utils.bytesToHex(publicKey))
  // publicKey: 0x04dacc38e9bc3a8ccf2a0642a1481ab3ba4480d9a804927c84c621ac394d556b01351f98176e1614272a242f6ca31d21b8baead46be6b0c0f354a4fbfb477f6809

    // let k === priv
  var sig = sign(Buffer.from(m,'hex'), Buffer.from(privKey.slice(2),'hex'), Buffer.from(privKey.slice(2),'hex'));
  let rs= {
    s: web3.utils.bytesToHex(sig.s).slice(2),
    r: web3.utils.bytesToHex(sig.e).slice(2)+web3.utils.padLeft(web3.utils.toHex(publicKeyC[0] - 2 + 27), 64).slice(2)
  }

  return rs

}
module.exports = {
  schnorr_sign,getProposolSign,
}

