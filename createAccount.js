
const algosdk = require('algosdk')



function main() {
  const generatedAccount = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(generatedAccount.sk);
  console.log(`My address: ${generatedAccount.addr}`);
  console.log(`My mnemonic: ${mnemonic}`);
}

main()