
/**
 * Copyright (c) 2025 weimeme
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { checkAddress} from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { KeyringPair } from "@polkadot/keyring/types";
import {NativeTokenInfo, TransferDetail, TransferDetailWithMemo} from "../types";
import { hexToBytes} from "ethereum-cryptography/utils.js";
import { SubscanApi } from "./subscan-api";
import {convertJsonToEncryptedMemo, type ICryptMessage, EncryptedMemo, type KeypairType} from "@eliza-dot-aes/common"
import {SR25519AES} from "@eliza-dot-aes/sr25519-aes"


/**
 * Main client class for interacting with Substrate-based blockchains.
 * Provides methods for address validation, key management, balance queries,
 * transfers with encrypted memos, and message sending.
 * Supports both native token and asset transfers with optional memo encryption.
 */
export class SubstrateChain {
    public api!: ApiPromise;
    public ss58Format: number; 
    public chainName: string;
    public cryptMessage: ICryptMessage | null;
    public isEthereum: boolean = false; 
    public nativeToken: NativeTokenInfo;
    public subscanApi: SubscanApi | null;
    public keyPairType: KeypairType;
    private constructor(public rpcUrl: string, private privateKey: string, keypairType: KeypairType = "sr25519", subscanApi: SubscanApi | null = null, cryptMessage: ICryptMessage | null = null) {
        this.rpcUrl = rpcUrl;   
        this.privateKey = privateKey;
        this.keyPairType = keypairType;
        this.subscanApi = subscanApi;
        this.cryptMessage = cryptMessage;
    }

    /**
     * Factory method to create and initialize a SubstrateChain instance.
     * This is the preferred way to create a SubstrateChain as it ensures proper initialization.
     * 
     * @param rpcUrl - The RPC endpoint URL of the Substrate chain
     * @param privateKey - The private key (hex string) for signing transactions
     * @param subscanApi - Optional SubscanApi instance for querying transaction memos
     * @param cryptMessage - Optional encryption service for memo encryption/decryption
     * @returns Promise resolving to an initialized SubstrateChain instance
     * @throws Error if initialization fails
     */
    public static async create(rpcUrl: string, privateKey: string, keypairType: KeypairType = "sr25519", subscanApi: SubscanApi | null = null, cryptMessage: ICryptMessage | null = null): Promise<SubstrateChain> {
        try {
            const service = new SubstrateChain(rpcUrl, privateKey, keypairType, subscanApi, cryptMessage);
            await service.init();
            if (cryptMessage != null && keypairType != cryptMessage.getKeyPairType()) {
                throw new Error("keyPairType and cryptMessage are not consistent");
            }
            return service;
        } catch (e) {
            throw Error(`Failed to create SubstrateService: ${e}`);
            // throw e;
        }
    }

    /**
     * Asynchronously initializes the Substrate API connection and chain properties.
     * Fetches chain information including chain name, SS58 format, token details, and Ethereum compatibility.
     * Must be called before using any other methods.
     * 
     * @throws Error if the RPC connection fails or chain properties cannot be retrieved
     */
    private async init() {
        try {
            const provider = new HttpProvider(this.rpcUrl);
            this.api = await ApiPromise.create({ provider });
            const chain = await this.api.rpc.system.chain();
            const properties = await this.api.rpc.system.properties();
            this.chainName = chain.toString();
            this.isEthereum = properties.isEthereum.isTrue;
            this.ss58Format = properties.ss58Format.unwrap().toNumber()
            this.nativeToken = {
                tokenSymbol: properties.tokenSymbol.unwrap().toArray()[0].toString(),
                decimals: properties.tokenDecimals.unwrap().toArray()[0].toNumber(),
            }
        } catch (e) {
            console.error(`Failed to initialize SubstrateService: ${e}`);
            throw e;
        }
    }

    /**
     * Updates the RPC endpoint URL and reconnects to the chain.
     * Disconnects the existing API connection before establishing a new one.
     * 
     * @param rpcUrl - The new RPC endpoint URL
     * @throws Error if the new RPC connection fails
     */
    public async updateRpcUrl(rpcUrl: string) {
        try {
            const oldChainName = this.chainName;
            if (this.api != null) {
                await this.api.disconnect();
            }
            this.rpcUrl = rpcUrl;
            const provider = new HttpProvider(this.rpcUrl);
            const newApi = await ApiPromise.create({provider: provider});
            if ((await newApi.rpc.system.chain()).toString() != oldChainName) {
                throw new Error("new RPC URL is not the same chain");
            }
            this.api = newApi;

            return true;
        } catch (e) {
            throw Error(`Failed to updateRpcUrl: ${e}`);
            return false;
        }
    }

    /**
     * Checks if the connected chain is Ethereum-compatible.
     * 
     * @returns Promise resolving to true if the chain is Ethereum-compatible, false otherwise
     */
    public async isEthereumChain(): Promise<boolean> {
        return this.isEthereum;
    }

    /**
     * Updates the private key used for signing transactions.
     * 
     * @param privateKey - The new private key (hex string)
     * @returns Promise resolving to the updated private key
     */
    public async updatePrivateKey(privateKey: string): Promise<string> {
        try {
            this.cryptMessage = await SR25519AES.build(privateKey);
            this.privateKey = privateKey;
            return this.privateKey;

        } catch (e) {
            throw Error(`Failed to updatePrivateKey: ${e}`);
        }
        
    }

     
    /**
     * Validates a Substrate address format using the chain's SS58 format.
     * Ethereum-compatible chains are not supported.
     * 
     * @param address - The address string to validate
     * @returns true if the address is valid, false otherwise
     */
    public validateAddress(address: string): boolean {
        const [isValid] = checkAddress(address, this.ss58Format);
        return isValid
}


    /**
     * Extracts the public key from a Substrate address.
     * Ethereum-compatible chains are not supported.
     * 
     * @param address - The Substrate address
     * @returns Promise resolving to the public key as a hex string, or empty string if Ethereum chain
     * @throws Error if the address is invalid or extraction fails
     */
    public async getAddressPublicKey(address: string): Promise<string> {
        try {
            const keyring = new Keyring({type: this.keyPairType, ss58Format: this.ss58Format});
            const keyPair = keyring.addFromAddress(address);
            return u8aToHex(keyPair.publicKey);
        } catch (e) {
            throw Error(`Failed to getAddressPublicKey: ${e}`);
        }
    }

    /**
     * Derives the address from the stored private key.
     * Uses the chain's SS58 format for address encoding.
     * 
     * @returns Promise resolving to the derived address
     * @throws Error if key derivation fails
     */
    public async getMyAddress(): Promise<string> {
        const keyring = new Keyring({type: this.keyPairType, ss58Format: this.ss58Format});
        const keyPair = keyring.addFromSeed(hexToU8a(this.privateKey));
        return keyPair.address;
    }

    /**
     * Gets the SS58 address format used by this chain.
     * 
     * @returns The SS58 format number
     */
    public getSs58Format(): number {
        return this.ss58Format;
    }

    /**
     * Gets the name of the connected chain.
     * 
     * @returns The chain name as a string
     */
    public getChainName(): string {
        return this.chainName;
    }

    /**
     * Gets the current RPC endpoint URL.
     * 
     * @returns The RPC URL string
     */
    public getRpcUrl(): string {
        return this.rpcUrl;
    }

//    /**
//     * Retrieves the balance of the current account.
//     * Queries native token balance if assetId is null, otherwise queries asset balance.
//     * 
//     * @param assetId - Optional asset ID for querying asset balance (null for native token)
//     * @returns Promise resolving to the account balance as BigInt
//     * @throws Error if the balance query fails
//     */
//     public async getMyBalance(assetId: number | null = null): Promise<BigInt> {
//         try {
//             const address = await this.getMyAddress();
//             if (assetId == null) {
//                 const balance = await this.api.query.system.account(address);
//                 return BigInt(((balance as any).data).free.toString());
//             }
//             const assetBalance = await this.api.query.assets.account(assetId, address);
//             return BigInt(assetBalance.toJSON()["balance"].toString());    
//         } catch (e) {
//             // throw Error(`Failed to getMyBalance: ${e}`);
//             console.error(`Failed to getMyBalance: ${e}`);
//             return BigInt(0);
//             }
//         }

    // 获得用户的资产余额
    public async getUserBalance(address: string, assetId: number | null = null): Promise<bigint> {
        try {
            // const address = await this.getMyAddress();
            if (assetId == null) {
                const balance = await this.api.query.system.account(address);
                return BigInt(((balance as any).data).free.toString());
            }
            const assetBalance = await this.api.query.assets.account(assetId, address);
            return BigInt(assetBalance.toJSON()["balance"].toString());    
        } catch (e) {
            // throw Error(`Failed to getMyBalance: ${e}`);
            console.error(`Failed to getMyBalance: ${e}`);
            return BigInt(0);
            }
    }

    /**
     * Creates a keyring pair from the stored private key.
     * Used for signing transactions.
     * 
     * @returns Promise resolving to the KeyringPair instance
     * @throws Error if key pair creation fails
     */
    public async getMyKeyPair(): Promise<KeyringPair> {
        try {
            const privateKey = this.privateKey;
            const keyring = new Keyring({type: this.keyPairType, ss58Format: this.ss58Format});
            const keyPair = keyring.addFromUri(privateKey);
            return keyPair;
        } catch (e) {
            throw Error(`Failed to getMyKeyPair: ${e}`);
        }
    }

    /**
     * Retrieves and decrypts the memo message from a transfer transaction.
     * Fetches transaction details via Subscan API and attempts to decrypt the memo if encrypted.
     * Returns empty string if no memo is found or if decryption fails.
     * 
     * @param txHash - The transaction hash to query
     * @returns Promise resolving to the decrypted memo string, or empty string if not found
     * @throws Error if SubscanApi is not initialized, transaction not found, or decryption fails
     */
    public async getTransferMemo(txHash: string): Promise<TransferDetailWithMemo> {
        try {
            if (this.subscanApi == null) {
                throw new Error("subscanApi is null");
            }
            const txDetails: TransferDetailWithMemo = await this.subscanApi.getTransferByHash(txHash);
            if (txDetails == null || txDetails == undefined) {
                throw new Error("txDetails is null");
            }
            const transfer = await this.subscanApi.decryptTransfersMemo([txDetails], this.cryptMessage);
            return transfer[0];

        } catch (e) {
            throw Error(`Failed to getTransactionMemo: ${e}`);
        }
    }

    /**
     * Encrypts a memo message using the recipient's public key.
     * This is a private helper method used internally for memo encryption.
     * Ethereum-compatible chains are not supported.
     * 
     * @param memo - The plaintext memo message to encrypt
     * @param to - The recipient address
     * @param toPublicKey - Optional recipient public key (will be derived from address if not provided)
     * @returns Promise resolving to EncryptedMemo object, or null if encryption fails or Ethereum chain
     */
    private async encryptMemo(memo: string, to: string, toPublicKey: string = null): Promise<EncryptedMemo> {
        
        if (memo == null) {
            return null;
        }
        toPublicKey = toPublicKey ?? await this.getAddressPublicKey(to);
        if (toPublicKey == null) {
            return null;
        }
        const encryptedMemo = await this.cryptMessage.encryptMessage(memo, hexToBytes(toPublicKey));
        return {e: encryptedMemo, t: this.keyPairType as KeypairType, to: to};
    }


    /**
     * Decrypts an encrypted memo message using the current account's private key.
     * This is a private helper method used internally for memo decryption.
     * Ethereum-compatible chains are not supported.
     * 
     * @param memo - The EncryptedMemo object containing the encrypted message
     * @returns Promise resolving to the decrypted memo string, or empty string if decryption fails
     */
    // private async decryptMemo(memo: EncryptedMemo): Promise<string> {
    //     if (this.isEthereum) {
    //         return "";
    //     }
    //     if (memo == null) {
    //         return "";
    //     }
    //     const decryptedMemo = await this.cryptMessage.decryptMessage(memo.e);
    //     return decryptedMemo;
    // }

    /**
     * Performs a native token transfer with an optional encrypted memo.
     * If memo is provided, encrypts it and includes it in a batch transaction with the transfer.
     * The memo is encrypted using the recipient's public key so only they can decrypt it.
     * 
     * @param to - The recipient address
     * @param amount - The transfer amount (can be 0 for message-only transfers)
     * @param memo - Optional memo message to encrypt and attach to the transfer
     * @returns Promise resolving to the transaction hash
     * @throws Error if address is invalid or transaction fails
     */
    public async transferWithMemo(to: string, amount: bigint, memo: string | null = null): Promise<string> {
        try {
        if (!this.validateAddress(to)) {
            throw new Error("to is not a valid address");
        }
        if (memo == null) {
            const tx = await this.api.tx.balances.transferKeepAlive(to, amount).signAndSend(await this.getMyKeyPair());
            return tx.toString();
        }
        const m: EncryptedMemo = await this.encryptMemo(memo, to, null);
        const transfer = this.api.tx.balances.transferKeepAlive(to, amount);
        const remark = this.api.tx.system.remark(JSON.stringify(m));
        const tx = await this.api.tx.utility.batchAll([transfer, remark]).signAndSend(await this.getMyKeyPair());
        return tx.toString();
        } catch (e) {
            throw Error(`Failed to transferWithMemo: ${e}`);
        }

    }



    /**
     * Sends an encrypted message to a recipient without transferring tokens.
     * Performs a zero-amount transfer with the message as an encrypted memo.
     * 
     * @param to - The recipient address
     * @param message - The message content to encrypt and send
     * @returns Promise resolving to the transaction hash
     * @throws Error if message is null or transaction fails
     */
    public async sendMessage(to: string, message: string): Promise<string> {
        try {
            if (message == null) {
                throw new Error("message is null");
            }
            return await this.transferWithMemo(to, BigInt(0), message);
        }
        catch (e) {
            throw Error(`Failed to sendMessage: ${e}`);
        }
    }
    
    /**
     * Performs an asset transfer with an optional encrypted memo.
     * If assetId is null, performs a native token transfer instead.
     * If memo is provided, encrypts it and includes it in a batch transaction with the transfer.
     * 
     * @param to - The recipient address
     * @param amount - The transfer amount (must be greater than 0 for asset transfers)
     * @param assetId - The asset ID to transfer (null for native token)
     * @param memo - Optional memo message to encrypt and attach to the transfer
     * @returns Promise resolving to the transaction hash
     * @throws Error if amount is 0, address is invalid, or transaction fails
     */
    public async assetsTransferWithMemo(to: string, amount: bigint, assetId : number | null, memo: string | null = null): Promise<string> {
        try {
            if (assetId == null) {
                return await this.transferWithMemo(to, amount, memo);
            }
            // if (amount == 0) {
            //     throw new Error("amount must be greater than 0");
            // }
            if (!this.validateAddress(to)) {
                throw new Error("to is not a valid address");
            }
            if (memo == null) {
                const tx = await this.api.tx.assets.transferKeepAlive(assetId, to, amount).signAndSend(await this.getMyKeyPair());
                return tx.toString();
            }
            const m: EncryptedMemo = await this.encryptMemo(memo, to, null);
            const transfer = this.api.tx.assets.transferKeepAlive(assetId, to, amount);
            const remark = this.api.tx.system.remark(JSON.stringify(m));
            const txHash = await this.api.tx.utility.batchAll([transfer, remark]).signAndSend(await this.getMyKeyPair());
            return txHash.toString();
        } catch (e) {
            throw Error(`Failed to assetsTransferWithMemo: ${e}`);
        }
    }

  /**
   * Retrieves the latest finalized block height from the chain.
   * 
   * @returns Promise resolving to the latest block height as a number
   * @throws Error if the RPC call fails
   */
  public async getLatestBlockHeight(): Promise<number> {
    const blockHash = await this.api.rpc.chain.getFinalizedHead();
    const blockHeader = await this.api.rpc.chain.getHeader(blockHash)
    return blockHeader.number.toNumber();
  }

  /**
   * 
   * @param assetId - The asset ID to get the decimals for (null for native token)
   * @returns Promise resolving to the asset decimals as a number
   * @throws Error if the RPC call fails
   */
  public async getAssetsDecimals(assetId: number|null = null): Promise<number> {
    if (assetId === null) {
        return this.nativeToken.decimals;
    }

    try {
      const assetMetadata = await this.api.query.assets.metadata(assetId);
      return (assetMetadata as any).decimals.toNumber();
    } catch (e) {
      throw Error(`Failed to getAssetsDecimals: ${e}`);
    }
  }

  /**
   * Retrieves the native token information for the chain.
   * Includes token symbol and decimal places.
   * 
   * @returns Promise resolving to NativeTokenInfo object
   */
  public async getNativeTokenInfo(): Promise<NativeTokenInfo> {
    return this.nativeToken;
  }
  
}