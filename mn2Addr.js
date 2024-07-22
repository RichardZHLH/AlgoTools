const algosdk = require('algosdk')

function main() {
  let mn = process.env.MN
  let acct = algosdk.mnemonicToSecretKey(mn)
  console.log("the account address is:", acct.addr)
}


main()