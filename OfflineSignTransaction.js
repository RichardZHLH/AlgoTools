const algosdk = require('algosdk')
const fs = require('fs')

function main() {
  let mn = process.env.MN
  let acct = algosdk.mnemonicToSecretKey(mn)

  let stx = fs.readFileSync('./Transaction.json', 'utf-8').trim()
  let unsignedTx = algosdk.decodeUnsignedTransaction(Buffer.from(stx, 'hex'))
  console.log("unsignedTx:")
  unsignedTx.prettyPrint()

  
  const signedTxn = unsignedTx.signTxn(acct.sk);
  console.log("signedTxn:", Buffer.from(signedTxn).toString('hex'))

  fs.writeFileSync('./signedTransaction.json', Buffer.from(signedTxn).toString('hex'))
}


main()