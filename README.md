# @chainsupport/eliza-polkadot-assethub

Core Polkadot Asset Hub blockchain plugin for Eliza OS that provides essential services and actions for asset operations, transfers, and encrypted messaging on the Polkadot ecosystem.

## Overview

The Polkadot Asset Hub plugin serves as a foundational component of Eliza OS, bridging Polkadot Asset Hub blockchain capabilities with the Eliza ecosystem. It provides crucial services for asset operations, transfers, balance management, encrypted messaging, and transaction history, enabling both automated and user-directed interactions with the Polkadot Asset Hub blockchain.

## Features

### Asset Operations

- **Asset Transfers**: Transfer both native DOT and assets (tokens) securely
- **Balance Queries**: Query balance for any address or asset
- **Multi-Asset Support**: Support for native DOT and custom assets via asset IDs
- **Encrypted Memos**: Optional encrypted memo messages attached to transfers

### Wallet Management

- **Wallet Information**: Retrieve wallet address and balance
- **Transaction History**: Complete transaction history with decrypted memos
- **Address Validation**: Validate Substrate addresses
- **Balance Tracking**: Real-time balance monitoring for multiple assets

### Encrypted Messaging

- **Secure Messaging**: Send encrypted messages via zero-amount transfers
- **Memo Encryption**: End-to-end encrypted memo messages using recipient's public key
- **Message Decryption**: Automatic decryption of received encrypted memos
- **Privacy Protection**: Messages only readable by intended recipient

### Transaction Management

- **Transaction History**: Complete transfer history with memo decryption
- **Subscan Integration**: Integration with Subscan API for transaction data
- **Memo Retrieval**: Retrieve and decrypt memos from past transactions
- **Transaction Tracking**: Track sent and received transactions

## Security Features

### Access Control

- **Wallet Management**: Secure wallet key derivation and storage
- **Private Key Protection**: Secure private key handling with SR25519 encryption
- **Key Derivation**: Support for SR25519 keypair type
- **Address Validation**: SS58 format validation for addresses

### Encryption

- **Memo Encryption**: SR25519-based encryption for memo messages
- **Public Key Encryption**: Messages encrypted using recipient's public key
- **Automatic Decryption**: Seamless decryption of received messages
- **Key Management**: Secure keypair management and derivation

### Risk Management

- **Balance Validation**: Pre-transfer balance checks
- **Address Validation**: Multi-level address format validation
- **Transaction Limits**: Configurable transaction validation
- **Error Handling**: Comprehensive error handling and reporting

## Installation

```bash
npm install @chainsupport/eliza-polkadot-assethub
```

## Configuration

Configure the plugin by setting the following environment variables:

```typescript
const polkadotAssetHubEnvSchema = {
  ASSET_HUB_RPC_URL: string(optional),      // RPC endpoint URL (defaults to public endpoint)
  ASSET_HUB_PRIVATE_KEY: string(required),   // Private key for wallet operations (hex format)
  SUBSCAN_X_API_KEY: string(optional),       // Subscan API key for transaction history
};
```

### Required Configuration

- **ASSET_HUB_PRIVATE_KEY**: Your wallet's private key in hex format (0x...). This is required for all operations.

### Optional Configuration

- **ASSET_HUB_RPC_URL**: Custom RPC endpoint URL. Defaults to public endpoint if not provided.
- **SUBSCAN_X_API_KEY**: Subscan API key for enhanced transaction history features. Optional but recommended.

## Usage

### Basic Setup

```typescript
import { polkadotAssetHubPlugin } from '@chainsupport/eliza-polkadot-assethub';

// Initialize the plugin
const runtime = await initializeRuntime({
  plugins: [polkadotAssetHubPlugin],
  settings: {
    ASSET_HUB_PRIVATE_KEY: '0x...', // Your private key
    ASSET_HUB_RPC_URL: 'https://rpc-asset-hub-polkadot.luckyfriday.io', // Optional
    SUBSCAN_X_API_KEY: 'your-api-key', // Optional
  },
});
```

### Services

#### AssetHubService

Main service for interacting with Polkadot Asset Hub blockchain.

```typescript
const assetHubService = runtime.getService('Polkadot Asset Hub');

// Access chain client
const address = await assetHubService.chain.getMyAddress();
const balance = await assetHubService.chain.getUserBalance(address, assetId);

// Access Subscan API
const history = await assetHubService.subscanApi.addressTransferHistory(address);
```

#### SubstrateChain

Low-level blockchain client for Substrate-based chains.

```typescript
const chain = assetHubService.chain;

// Get wallet address
const address = await chain.getMyAddress();

// Query balance
const balance = await chain.getUserBalance(address, assetId); // assetId: null for DOT

// Transfer assets
const txHash = await chain.assetsTransferWithMemo(recipient, amount, assetId, memo);

// Send encrypted message
const txHash = await chain.sendMessage(recipient, message);
```

#### SubscanApi

API client for transaction history and memo retrieval.

```typescript
const subscanApi = assetHubService.subscanApi;

// Get transfer history
const history = await subscanApi.addressTransferHistory(address);

// Decrypt memos
const decryptedHistory = await subscanApi.decryptTransfersMemo(history, cryptMessage);
```

## Actions

### transferAssets

Transfers assets or native DOT between wallets with optional encrypted memo.

```typescript
// Example usage
const result = await runtime.executeAction('TRANSFER_ASSETS_POLKADOT', {
  assetId: 1984, // null for native DOT transfers
  recipient: '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe',
  amount: 1000,
  memo: 'Hello, this is an encrypted message', // Optional
});
```

**Parameters:**
- `assetId`: Asset ID (number) or `null` for native DOT transfers
- `recipient`: Recipient wallet address (string)
- `amount`: Transfer amount (number)
- `memo`: Optional encrypted memo message (string | null)

**Common Asset IDs:**
- USDT: 1984
- USDC: 1337
- Native DOT: null

### addressAssetsBalance

Queries balance for any address or asset.

```typescript
// Example usage - Query own DOT balance
const result = await runtime.executeAction('USER_ASSETS_BALANCE', {
  address: null, // null for own address
  assetId: null, // null for native DOT
});

// Example usage - Query user's asset balance
const result = await runtime.executeAction('USER_ASSETS_BALANCE', {
  address: '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe',
  assetId: 1984, // USDT
});
```

**Parameters:**
- `address`: Address to query (string | null) - null for own address
- `assetId`: Asset ID (number | null) - null for native DOT

### sendMessage

Sends an encrypted message to another user via zero-amount transfer.

```typescript
// Example usage
const result = await runtime.executeAction('SEND_MESSAGE', {
  recipient: '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe',
  message: 'Hello, this is a private message',
});
```

**Parameters:**
- `recipient`: Recipient wallet address (string)
- `message`: Message content to encrypt and send (string)

### myWalletHistory

Retrieves complete transaction history with decrypted memos.

```typescript
// Example usage
const result = await runtime.executeAction('MY_WALLET_HISTORY', {});
```

**Returns:**
- Complete transaction history with decrypted memos
- Includes sender, recipient, amount, memo, timestamp, and transaction ID

### getMyWalletInfo

Retrieves current wallet information including address and balance.

```typescript
// Example usage
const result = await runtime.executeAction('GET_MY_WALLET_INFO', {});
```

**Returns:**
- Wallet address
- Native DOT balance

## Performance Optimization

1. **RPC Optimization**
   - Use reliable RPC endpoints
   - Implement connection pooling
   - Monitor RPC usage and rate limits

2. **Cache Management**
   - Cache balance queries
   - Cache transaction history
   - Configure appropriate TTL settings

3. **Transaction Management**
   - Batch operations when possible
   - Implement retry strategies
   - Monitor transaction success rates

## System Requirements

- Node.js 16.x or higher
- TypeScript 5.x or higher
- Minimum 4GB RAM recommended
- Stable internet connection
- Access to Polkadot Asset Hub RPC endpoint

## Dependencies

### Core Dependencies

- `@elizaos/core`: Eliza OS core framework
- `@polkadot/api`: Polkadot API client
- `@polkadot/keyring`: Keyring for key management
- `@polkadot/util-crypto`: Cryptographic utilities

### Encryption Dependencies

- `@eliza-dot-aes/sr25519-aes`: SR25519 encryption for memos
- `@eliza-dot-aes/common`: Common encryption utilities

## Troubleshooting

### Common Issues

1. **Wallet Connection Failures**

```bash
Error: Failed to start Polkadot Asset Hub service
```

**Solutions:**
- Verify RPC endpoint is accessible
- Check private key format (must start with 0x)
- Ensure proper network selection
- Verify ASSET_HUB_PRIVATE_KEY is set correctly

2. **Transaction Errors**

```bash
Error: Insufficient balance
```

**Solutions:**
- Check account balance before transfer
- Verify amount is within available balance
- Ensure sufficient balance for transaction fees
- Check asset ID is correct

3. **Address Validation Errors**

```bash
Error: Invalid address
```

**Solutions:**
- Verify address format (SS58 encoding)
- Check address is for Polkadot network (SS58 format 0)
- Ensure address is not empty or null

4. **Subscan API Errors**

```bash
Error: Failed to get transaction history
```

**Solutions:**
- Verify SUBSCAN_X_API_KEY is set correctly
- Check API key has proper permissions
- Ensure network connectivity
- Verify Subscan API service status

5. **Encryption Errors**

```bash
Error: Failed to encrypt/decrypt memo
```

**Solutions:**
- Verify recipient address is valid
- Check encryption service is initialized
- Ensure proper keypair type (SR25519)
- Verify message is not null or empty

## Safety & Security

### Best Practices

1. **Environment Variables**
   - Store private keys in secure environment variables
   - Never commit private keys to version control
   - Use .env.example for non-sensitive defaults
   - Rotate API keys regularly

2. **Private Key Management**
   - Use secure key derivation
   - Never expose private keys in logs
   - Implement proper key storage
   - Use hardware wallets for production

3. **Transaction Limits**
   - Set maximum transaction amounts
   - Implement daily transfer limits
   - Configure per-asset restrictions
   - Monitor unusual transaction patterns

4. **Monitoring**
   - Track failed transaction attempts
   - Monitor balance changes
   - Log security-relevant events
   - Set up alerts for suspicious activity

5. **Encryption**
   - Always use encrypted memos for sensitive data
   - Verify recipient addresses before sending
   - Test encryption/decryption in development
   - Keep encryption libraries updated

## API Reference

### AssetHubService

Main service class for Polkadot Asset Hub operations.

**Methods:**
- `start(runtime)`: Initialize the service
- `stop()`: Clean up resources
- `chain`: Access SubstrateChain client
- `subscanApi`: Access SubscanApi client

### SubstrateChain

Blockchain client for Substrate-based chains.

**Key Methods:**
- `getMyAddress()`: Get wallet address
- `getUserBalance(address, assetId)`: Query balance
- `assetsTransferWithMemo(to, amount, assetId, memo)`: Transfer assets
- `transferWithMemo(to, amount, memo)`: Transfer native DOT
- `sendMessage(to, message)`: Send encrypted message
- `getTransferMemo(txHash)`: Retrieve and decrypt memo from transaction

### SubscanApi

API client for transaction history.

**Key Methods:**
- `addressTransferHistory(address)`: Get transfer history
- `decryptTransfersMemo(transfers, cryptMessage)`: Decrypt memos
- `getTransferByHash(hash)`: Get transfer by transaction hash

## Examples

### Complete Transfer Example

```typescript
// Transfer USDT with encrypted memo
const result = await runtime.executeAction('TRANSFER_ASSETS_POLKADOT', {
  assetId: 1984, // USDT
  recipient: '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe',
  amount: 1000,
  memo: 'Payment for services rendered',
});
```

### Query Balance Example

```typescript
// Query own DOT balance
const result = await runtime.executeAction('USER_ASSETS_BALANCE', {
  address: null,
  assetId: null,
});
```

### Send Encrypted Message Example

```typescript
// Send private message
const result = await runtime.executeAction('SEND_MESSAGE', {
  recipient: '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe',
  message: 'This message is encrypted and only the recipient can read it',
});
```

## Support

For issues and feature requests, please:

1. Check the troubleshooting guide above
2. Review existing GitHub issues
3. Submit a new issue with:
   - System information
   - Error logs
   - Steps to reproduce
   - Transaction IDs (if applicable)
   - Network information (mainnet/testnet)

## License

Licensed under the Apache License, Version 2.0. See LICENSE file for details.

## Contributing

Contributions are welcome! Please ensure:

- Code follows project style guidelines
- All tests pass
- Documentation is updated
- Security best practices are followed

## Acknowledgments

- Polkadot ecosystem for blockchain infrastructure
- Subscan for transaction history API
- Eliza OS team for the framework

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
