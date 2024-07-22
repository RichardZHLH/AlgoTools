# Algo

Online operate
1. install the dependencies
$ npm install

Then the following functions can run offline
1. print the algorand address from mnemonic
(1) set the environment variable MN
(2) run the nodejs script mn2Addr.js

``` bash
export MN='pelican thrive seed earn napkin dynamic arena broom glad nose avocado glow peasant talk hold inch replace mixed distance faculty exhibit flock laundry abstract pattern'
$ node mn2Addr.js
the account address is: JFQILQLC245IDCHXKLYZNMHJLX4KEN6VQECEKJE5VF6P56Q5FHTCU3AH3A
```

2. Sign the transaction.
(1) The transaction is placed in file Transaction.json
(2) export the mnemonic
(3) run the ndoejs script signJson.js

