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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubstrateChain } from '../src/common/substrate-chain';
import { SubscanApi } from '../src/common/subscan-api';
import { SR25519AES } from '@eliza-dot-aes/sr25519-aes';
import type { ICryptMessage } from '@eliza-dot-aes/common';
import { DEFAULT_ASSET_HUB_RPC_URL, DEFAULT_SUBSCAN_X_API_KEY} from '../src/constants';
import { TransferDetailWithMemo } from '../src/types';
import config from "../vitest.config"

describe('SubstrateChain', () => {
    let ASSETHUB_RPC_URL = config?.test?.env?.ASSETHUB_RPC_URL || DEFAULT_ASSET_HUB_RPC_URL;
    console.log("ASSETHUB_RPC_URL", ASSETHUB_RPC_URL);
    const ALICE_PRIVATE_KEY = config?.test?.env?.ALICE_PRIVATE_KEY || "";
    console.log("ALICE_PRIVATE_KEY", ALICE_PRIVATE_KEY);
    const BOB_PRIVATE_KEY = config?.test?.env?.BOB_PRIVATE_KEY || "";
    console.log("BOB_PRIVATE_KEY", BOB_PRIVATE_KEY);
    const mockNetwork = 'Polkadot Asset Hub';
    const SUBSCAN_API_KEY = config?.test?.env?.SUBSCAN_API_KEY || DEFAULT_SUBSCAN_X_API_KEY;
    console.log("SUBSCAN_API_KEY", SUBSCAN_API_KEY);
    let subscanApi: SubscanApi;
    let cryptMessage: ICryptMessage;

    beforeEach(async () => {
        subscanApi = new SubscanApi(mockNetwork, SUBSCAN_API_KEY);
        cryptMessage = await SR25519AES.build(ALICE_PRIVATE_KEY);
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('should create and initialize SubstrateChain with all parameters', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY,
                'sr25519',
                subscanApi,
                cryptMessage
            );

            expect(chain).toBeDefined();
            const blockHeight = await chain.getLatestBlockHeight();
            expect(blockHeight).toBeGreaterThan(0);
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBe(subscanApi);
            
            // Verify chain properties are initialized
            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            const ss58Format = chain.getSs58Format();
            expect(ss58Format).toBe(0);
            
            // Cleanup
            // await chain.api.disconnect();
        }, ); // 30 seconds timeout for real RPC connection

        it('should create SubstrateChain with minimal parameters (no subscanApi and cryptMessage)', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY,
                'sr25519',
                null,
                null
            );

            expect(chain).toBeDefined();
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBeNull();
            
            // Verify chain properties are initialized
            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            // Cleanup
            // await chain.api.disconnect();
        });

        it('should create SubstrateChain with only rpcUrl and privateKey', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            expect(chain).toBeDefined();
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(chain.keyPairType).toBe('sr25519'); // default keypair type
            
            // Cleanup
            await chain.api.disconnect();
        }, );

        it('should initialize native token info correctly', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY,
                'sr25519',
                null,
                null
            );

            const nativeTokenInfo = await chain.getNativeTokenInfo();
            expect(nativeTokenInfo).toBeDefined();
            expect(nativeTokenInfo.tokenSymbol).toBe("DOT");
            expect(nativeTokenInfo.decimals).toBe(10);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should initialize chain name correctly', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should initialize SS58 format correctly', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const ss58Format = chain.getSs58Format();
            expect(ss58Format).toBe(0);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should not be Ethereum chain', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const isEthereum = await chain.isEthereumChain();
            expect(isEthereum).toBe(false);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should validate initialization parameters', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY,
                'sr25519',
                subscanApi,
                cryptMessage
            );

            // Verify all initialization parameters are set correctly
            expect(chain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBe(subscanApi);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should throw error when RPC URL is invalid', { timeout: 300000 }, async () => {
            const invalidRpcUrl = 'wss://invalid-rpc-url-that-does-not-exist.com/ws';
            
            await expect(
                SubstrateChain.create(invalidRpcUrl, ALICE_PRIVATE_KEY)
            ).rejects.toThrow();
        }, );

        it('should handle different keypair types', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY,
                'sr25519'
            );

            expect(chain.keyPairType).toBe('sr25519');
            
            // Cleanup
            await chain.api.disconnect();
        }, );
    });

    describe('getMyAddress', () => {
        it('should derive address from private key', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const address = await chain.getMyAddress();
            expect(address).toBeTruthy();
            expect(typeof address).toBe('string');
            expect(address.length).toBeGreaterThan(0);
            // Cleanup
            // await chain.api.disconnect();
        }, );
    });

    describe('validateAddress', () => {
        it('should validate correct Substrate address', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );
            // First get a valid address
            const validAddress = await chain.getMyAddress();
            const isValid = chain.validateAddress(validAddress);
            expect(isValid).toBe(true);
            
            // Cleanup
            await chain.api.disconnect();
        }, );

        it('should reject invalid address', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const invalidAddress = 'invalid-address-string';
            const isValid = chain.validateAddress(invalidAddress);
            expect(isValid).toBe(false);
            
            // Cleanup
            await chain.api.disconnect();
        }, );
    });

    describe('updateRpcUrl', () => {
        it('should update RPC URL and reconnect to the chain', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const originalRpcUrl = chain.getRpcUrl();
            const newRpcUrl = 'https://polkadot-asset-hub-rpc.polkadot.io';
            
            // Update RPC URL
            await chain.updateRpcUrl(newRpcUrl);
            
            // Verify RPC URL is updated
            expect(chain.getRpcUrl()).toBe(newRpcUrl);
            expect(chain.getRpcUrl()).not.toBe(originalRpcUrl);
            
            // Verify new API connection is established and working
            expect(chain.api).toBeTruthy();
            const chainName = chain.getChainName();
            expect(chainName).toBeTruthy();
            
            // Cleanup
            await chain.api.disconnect();
        }, );

        it('should maintain chain properties after updating RPC URL', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const originalChainName = chain.getChainName();
            const originalSs58Format = chain.getSs58Format();
            const originalKeyPairType = chain.keyPairType;
                
            const newRpcUrl = 'https://polkadot-asset-hub-rpc.polkadot.io';
            await chain.updateRpcUrl(newRpcUrl);
            
            // Verify RPC URL is updated
            expect(chain.getRpcUrl()).toBe(newRpcUrl);
            
            // Verify chain properties are maintained (should be same chain)
            const newChainName = chain.getChainName();
            const newSs58Format = chain.getSs58Format();
            
            // Chain name might be slightly different but should still be valid
            expect(newChainName).toBeTruthy();
            expect(newChainName).toBe(mockNetwork);
            
            // SS58 format should be the same (Polkadot chains use format 0)
            expect(newSs58Format).toBe(originalSs58Format);
            
            // Key pair type should remain unchanged
            expect(chain.keyPairType).toBe(originalKeyPairType);
            
            // Cleanup
            await chain.api.disconnect();
        }, );

        it('should throw error when updating RPC URL to invalid URL', { timeout: 300000 }, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );

            const invalidRpcUrl = 'invalid-rpc-url-that-does-not-exist.com/ws';
            await expect(chain.updateRpcUrl(invalidRpcUrl)).rejects.toThrow();
        }, );
    });

    // getAddressPublicKey
    describe('getAddressPublicKey', {timeout: 300000}, () => {
        it('should get public key from address', async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );
            const publicKey = await chain.getAddressPublicKey(await chain.getMyAddress());
            console.log("publicKey", publicKey);

            await expect(chain.getAddressPublicKey("error" as any)).rejects.toThrow();
        });
    }, );


    describe('getMyBalance', () => {
        it('should get my balance for native token', {timeout: 300000}, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );
            const balance = await chain.getUserBalance(await chain.getMyAddress());
            const balance2 = await chain.getUserBalance("error" as any);
            console.log("balance2", balance2);
            expect(balance2).toBe(BigInt(0));
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(0);
        });

        it('should get my balance for asset', {timeout: 300000}, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );
            const balance = await chain.getUserBalance(await chain.getMyAddress(), 18);
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(BigInt(0));
        });

        it('should get assets decimals', {timeout: 300000}, async () => {
            const chain = await SubstrateChain.create(
                ASSETHUB_RPC_URL,
                ALICE_PRIVATE_KEY
            );
            const decimals = await chain.getAssetsDecimals(18);
            console.log("decimals", decimals);
            expect(decimals).toBe(4)
            
            const decimals2 = await chain.getAssetsDecimals(null);
            console.log("decimals2", decimals2);
            expect(decimals2).toBe(10);

            await expect(chain.getAssetsDecimals("error" as any)).rejects.toThrow();
        });
    });

    describe('transferWithMemo', { timeout: 30000 * 2 * 20 }, () => {
        const rpc = "https://polkadot-asset-hub-rpc.polkadot.io";
        it('should transfer DOT with memo', async () => {
            console.log("ALICE_PRIVATE_KEY", ALICE_PRIVATE_KEY);
            const aliceChain = await SubstrateChain.create(
                rpc,
                ALICE_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(ALICE_PRIVATE_KEY)
            );
            console.log("aliceChain");
            const bobChain = await SubstrateChain.create(
                rpc,
                BOB_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(BOB_PRIVATE_KEY)
            );
            console.log("bobChain");
            const bobAddress = await bobChain.getMyAddress();
            console.log("bobAddress", bobAddress);
            await expect(aliceChain.transferWithMemo("invalid-address-string", BigInt(120000), "hello bob, i am alice, i am sending you 0.01 DOT")).rejects.toThrow();
            const txHash = await aliceChain.transferWithMemo(bobAddress, BigInt(120000), "hello bob, i am alice, i am sending you 0.01 DOT");
            console.log("txHash", txHash);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            const memo: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash);
            expect(memo.memo).toBe("hello bob, i am alice, i am sending you 0.01 DOT");
            console.log("memo", memo.memo);
            const bobMemo: TransferDetailWithMemo = await bobChain.getTransferMemo(txHash);
            console.log("bobMemo", JSON.stringify(bobMemo));
            expect(bobMemo.memo).toBe("hello bob, i am alice, i am sending you 0.01 DOT");
            const txHash2 = await aliceChain.transferWithMemo(bobAddress, BigInt(120000));
            console.log("txHash2", txHash2);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            expect(txHash2).toBeTruthy();
            const memo2: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash2);
            console.log("memo2", memo2);
            expect(memo2.memo).toBe(undefined);
        }, );

        it('should transfer asset with memo', { timeout: 30000 * 2 * 20 }, async () => {
            const aliceChain = await SubstrateChain.create(
                rpc,
                ALICE_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(ALICE_PRIVATE_KEY)
            );
            const bobChain = await SubstrateChain.create(
                rpc,
                BOB_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(BOB_PRIVATE_KEY)
            );
            const bobAddress = await bobChain.getMyAddress();
            console.log("bobAddress", bobAddress);
            await expect(aliceChain.assetsTransferWithMemo("invalid-address-string", BigInt(100000), 18, "hello bob, i am alice, i am sending you 18 assets")).rejects.toThrow();
            const txHash = await aliceChain.assetsTransferWithMemo(bobAddress, BigInt(100000), 18, "hello bob, i am alice, i am sending you 18 assets");
            console.log("txHash", txHash);
            await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
            const memo: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash);
            console.log("memo", memo.memo);
            expect(memo.memo).toBe("hello bob, i am alice, i am sending you 18 assets");
            const txHash2 = await aliceChain.assetsTransferWithMemo(bobAddress, BigInt(100000), 18);
            console.log("txHash2", txHash2);
            await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
            expect(txHash2).toBeTruthy();
            const memo2: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash2);
            console.log("memo2", memo2);
            expect(memo2.memo).toBe(undefined);
        }, );

        it('should send message to bob', { timeout: 30000 * 2 * 20 }, async () => {
            const aliceChain = await SubstrateChain.create(
                rpc,
                ALICE_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(ALICE_PRIVATE_KEY)
            );
            const bobChain = await SubstrateChain.create(
                rpc,
                BOB_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(BOB_PRIVATE_KEY)
            );
            const bobAddress = await bobChain.getMyAddress();
            console.log("bobAddress", bobAddress);  
            await expect(aliceChain.sendMessage(bobAddress, "")).rejects.toThrow();
            const txHash = await aliceChain.sendMessage(bobAddress, "hello bob, i am alice, i am sending you a message");
            console.log("txHash", txHash);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            const memo: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash);
            console.log("memo", memo.memo);
            expect(memo.memo).toBe("hello bob, i am alice, i am sending you a message");
        }, );

        it('should get 10 transactions for bob and decrypt them', { timeout: 30000 * 2 * 20 }, async () => {
            const bobChain = await SubstrateChain.create(
                rpc,
                BOB_PRIVATE_KEY,
                'sr25519',
                new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
                await SR25519AES.build(BOB_PRIVATE_KEY)
            );
            const bobAddress = await bobChain.getMyAddress();
            if (!bobChain.subscanApi) {
                throw new Error("subscanApi is not initialized");
            }
            const transactions = await bobChain.subscanApi.addressTransferHistory(bobAddress, undefined, undefined, undefined, 0, 10);
            const transfer: TransferDetailWithMemo[] = await bobChain.subscanApi.decryptTransfersMemo(transactions, await SR25519AES.build(BOB_PRIVATE_KEY));
            for (const tx of transfer) {
                console.log("tx: ", JSON.stringify(tx));
            }
        }, );
    });


});

