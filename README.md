# Dome SDK

Web sdk that helps to generate transaction scripts and serialize addresses to the miden felts.

## Features

### Data type serialization

SDK performs the serialization of commonly used entities into the miden felts without the wasm binary involving.

#### EVM address serialization

Example:

```js
const felts = evmAddressToFelts("0x58de221108ebf6ee0c28c7685e26487837f452e8");
```

Output:

```js
[17219208645177433688n, 8667219669801183244n, 3897750583n];
```

### Transaction masm script generation

SDK helps to form the transaction script from the request object

#### Disperse

Generates the disperse transaction script that distributes the asset from the account into a several CROSSCHAIN notes.

Example:

```js
const script = generateDisperseScript({
  assetAccountId: "0x63c9d7af451fda2000fa06ce0bdefd",
  shares: [
    {
      recipient:
        "0x8f13f40555b1382d890e646242466d5d088b10696a73660192980b94c0e46559",
      amount: 1000000n,
    },
    {
      recipient:
        "0xc63ad6622d2b7f9cec142ac1b0e8613f534d31e1dc76941ac335b9531baf9e98",
      amount: 2000000n,
    },
  ],
});
```

Output:

```masm
use.miden::tx
use.miden::contracts::wallets::basic
use.miden::contracts::auth

begin
    push.0x8f13f40555b1382d890e646242466d5d088b10696a73660192980b94c0e46559
    push.0
    push.2
    push.0
    push.4177657856
    call.tx::create_note

    push.0x40420f0000000000000000000000000020da1f45afd7c96300fdde0bce06fa00
    call.basic::move_asset_to_note dropw
    dropw dropw dropw drop

    push.0xc63ad6622d2b7f9cec142ac1b0e8613f534d31e1dc76941ac335b9531baf9e98
    push.0
    push.2
    push.0
    push.4177657856
    call.tx::create_note

    push.0x80841e0000000000000000000000000020da1f45afd7c96300fdde0bce06fa00
    call.basic::move_asset_to_note dropw
    dropw dropw dropw drop

    call.auth::basic::auth_tx_rpo_falcon512

end
```

## Contribution

### How to release

1. Push your feature to the main branch with PR or directly with [conventional commit message](https://www.conventionalcommits.org/en/v1.0.0/).
2. Wait for the job that bumps the version of the package
3. Visit [tags page](https://github.com/Polynom-Labs/dome-sdk/tags) and create the release from the created version tag with empty title
4. Wait for release job that pushes new vrsion of the lib to the [npm registry](https://www.npmjs.com/package/@dome-protocol/sdk)
