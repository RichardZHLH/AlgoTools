const algosdk = require('algosdk')




const assetID = 10458941;


async function main() {
  let mn = process.env.MN
  let acct = algosdk.mnemonicToSecretKey(mn)
  console.log("the account address is:", acct.addr)
  let algodClient = new algosdk.Algodv2('b7e384d0317b8050ce45900a94a1931e28540e1f69b2d242b424659c341b4697','https://testnet-api.algonode.cloud')

  const params = await algodClient.getTransactionParams().do();
  const unsignedTx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: acct.addr,
      to: acct.addr,
      amount: 0,
      assetIndex: assetID,
      suggestedParams: params
  });
  const signedTxn = unsignedTx.signTxn(acct.sk);

  const { txId } = await algodClient.sendRawTransaction(new Uint8Array(signedTxn)).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  console.log('Transaction Information:', result);
}


main()