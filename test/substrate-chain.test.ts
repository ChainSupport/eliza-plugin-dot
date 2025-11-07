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
import { DEFAULT_ASSET_HUB_RPC_URL} from '../src/constants';
import { TransferDetailWithMemo } from '../src/types';

describe('SubstrateChain', () => {
    const mockRpcUrl = 'https://rpc-asset-hub-polkadot.luckyfriday.io';
    const mockPrivateKey = "0x139ace2d79edcd1af5f5449e784e48b147bdc0f22598fbb0fe3c3f0e02a5c451";
    const mockNetwork = 'Polkadot Asset Hub';
    const mockApiKey = '371616121bcc4d1b8f59d4e2072135e4';
    const myAddress = '13GKHvBFjWuVjezV8cG6DMoK2FftY4awXXqKdunApnJGbvwd';
    let subscanApi: SubscanApi;
    let cryptMessage: ICryptMessage;

    beforeEach(async () => {
        subscanApi = new SubscanApi(mockNetwork, mockApiKey);
        cryptMessage = await SR25519AES.build(mockPrivateKey);
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('should create and initialize SubstrateChain with all parameters', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey,
                'sr25519',
                subscanApi,
                cryptMessage
            );

            expect(chain).toBeDefined();
            // 区块高度大于0
            const blockHeight = await chain.getLatestBlockHeight();
            expect(blockHeight).toBeGreaterThan(0);
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(mockRpcUrl);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBe(subscanApi);
            
            // Verify chain properties are initialized
            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            // expect(typeof chainName).toBe('string');
            
            const ss58Format = chain.getSs58Format();
            // console.log("ss58Format", JSON.stringify(ss58Format));
            expect(ss58Format).toBe(0);
            // expect(typeof ss58Format).toBeTypeOf('number');
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 }); // 30 seconds timeout for real RPC connection

        it('should create SubstrateChain with minimal parameters (no subscanApi and cryptMessage)', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey,
                'sr25519',
                null,
                null
            );

            expect(chain).toBeDefined();
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(mockRpcUrl);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBeNull();
            
            // Verify chain properties are initialized
            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should create SubstrateChain with only rpcUrl and privateKey', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            expect(chain).toBeDefined();
            expect(chain.api).toBeDefined();
            expect(chain.getRpcUrl()).toBe(mockRpcUrl);
            expect(chain.keyPairType).toBe('sr25519'); // default keypair type
            
            // Cleanup
            await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should initialize native token info correctly', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey,
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
        }, { timeout: 30000 });

        it('should initialize chain name correctly', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const chainName = chain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should initialize SS58 format correctly', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const ss58Format = chain.getSs58Format();
            expect(ss58Format).toBe(0);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should not be Ethereum chain', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const isEthereum = await chain.isEthereumChain();
            expect(isEthereum).toBe(false);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should validate initialization parameters', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey,
                'sr25519',
                subscanApi,
                cryptMessage
            );

            // Verify all initialization parameters are set correctly
            expect(chain.getRpcUrl()).toBe(mockRpcUrl);
            expect(chain.keyPairType).toBe('sr25519');
            expect(chain.subscanApi).toBe(subscanApi);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should throw error when RPC URL is invalid', async () => {
            const invalidRpcUrl = 'wss://invalid-rpc-url-that-does-not-exist.com/ws';
            
            await expect(
                SubstrateChain.create(invalidRpcUrl, mockPrivateKey)
            ).rejects.toThrow();
        }, { timeout: 30000 });

        it('should handle different keypair types', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey,
                'sr25519'
            );

            expect(chain.keyPairType).toBe('sr25519');
            
            // Cleanup
            await chain.api.disconnect();
        }, { timeout: 30000 });
    });

    describe('getMyAddress', () => {
        it('should derive address from private key', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const address = await chain.getMyAddress();
            expect(address).toBeTruthy();
            expect(typeof address).toBe('string');
            expect(address.length).toBeGreaterThan(0);
            // Polkadot addresses typically start with specific characters
            expect(address).toBe(myAddress);
            
            // Cleanup
            // await chain.api.disconnect();
        }, { timeout: 30000 });
    });

    describe('validateAddress', () => {
        it('should validate correct Substrate address', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );
            // First get a valid address
            const validAddress = await chain.getMyAddress();
            const isValid = chain.validateAddress(validAddress);
            expect(isValid).toBe(true);
            
            // Cleanup
            await chain.api.disconnect();
        }, { timeout: 30000 });

        it('should reject invalid address', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const invalidAddress = 'invalid-address-string';
            const isValid = chain.validateAddress(invalidAddress);
            expect(isValid).toBe(false);
            
            // Cleanup
            await chain.api.disconnect();
        }, { timeout: 30000 });
    });

    describe('updateRpcUrl', () => {
        it('should update RPC URL and reconnect to the chain', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
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
        }, { timeout: 300000 });

        it('should maintain chain properties after updating RPC URL', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
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
        }, { timeout: 1000000 });

        it('should throw error when updating RPC URL to invalid URL', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );

            const invalidRpcUrl = 'invalid-rpc-url-that-does-not-exist.com/ws';
            await expect(chain.updateRpcUrl(invalidRpcUrl)).rejects.toThrow();
        }, { timeout: 30000 });
    });

    describe('getMyBalance', () => {
        it('should get my balance for native token', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );
            const balance = await chain.getUserBalance(myAddress);
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(0);
        });

        it('should get my balance for asset', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );
            const balance = await chain.getUserBalance(myAddress, 18);
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(BigInt(0));
        });

        it('should get assets decimals', async () => {
            const chain = await SubstrateChain.create(
                mockRpcUrl,
                mockPrivateKey
            );
            const decimals = await chain.getAssetsDecimals(18);
            console.log("decimals", decimals);
            expect(decimals).toBe(4)
        });
    });

    describe('transferWithMemo', () => {
        const alicePrivateKey = "0x139ace2d79edcd1af5f5449e784e48b147bdc0f22598fbb0fe3c3f0e02a5c451";
        const bobPrivateKey = "0x139ace2d79edcd1af5f5449e784e48b147bdc0f22598fbb0fe3c3f0e02a5c452";
        const subscan = "371616121bcc4d1b8f59d4e2072135e4";
        const rpc = "https://polkadot-asset-hub-rpc.polkadot.io";
        it('should transfer DOT with memo', async () => {
            console.log("alicePrivateKey", alicePrivateKey);
            const aliceChain = await SubstrateChain.create(
                rpc,
                alicePrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(alicePrivateKey)
            );
            console.log("aliceChain");
            const bobChain = await SubstrateChain.create(
                rpc,
                bobPrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(bobPrivateKey)
            );
            console.log("bobChain");
            const bobAddress = await bobChain.getMyAddress();
            console.log("bobAddress", bobAddress);
            await expect(aliceChain.transferWithMemo("invalid-address-string", 120000, "hello bob, i am alice, i am sending you 0.01 DOT")).rejects.toThrow();
            const txHash = await aliceChain.transferWithMemo(bobAddress, 120000, "hello bob, i am alice, i am sending you 0.01 DOT");
            console.log("txHash", txHash);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            const memo: TransferDetailWithMemo = await aliceChain.getTransferMemo("0xecc6eb0a69067377ee84de944accc9bc2c54f2cf104f1fdb3261b114f9b115ff");
            expect(memo.memo).toBe("hello bob, i am alice, i am sending you a message");
            console.log("memo", memo.memo);
            const bobMemo: TransferDetailWithMemo = await bobChain.getTransferMemo("0xecc6eb0a69067377ee84de944accc9bc2c54f2cf104f1fdb3261b114f9b115ff");
            console.log("bobMemo", JSON.stringify(bobMemo));
            expect(bobMemo.memo).toBe("hello bob, i am alice, i am sending you a message");
            const txHash2 = await aliceChain.transferWithMemo(bobAddress, 120000);
            console.log("txHash2", txHash2);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            expect(txHash2).toBeTruthy();
            const memo2: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash2);
            console.log("memo2", memo2);
            expect(memo2.memo).toBe(undefined);
        }, { timeout: 30000 * 2 * 20 });

        it('should transfer asset with memo', async () => {
            const aliceChain = await SubstrateChain.create(
                rpc,
                alicePrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(alicePrivateKey)
            );
            const bobChain = await SubstrateChain.create(
                rpc,
                bobPrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(bobPrivateKey)
            );
            const bobAddress = await bobChain.getMyAddress();
            console.log("bobAddress", bobAddress);
            await expect(aliceChain.assetsTransferWithMemo("invalid-address-string", 100000, 18, "hello bob, i am alice, i am sending you 18 assets")).rejects.toThrow();
            const txHash = await aliceChain.assetsTransferWithMemo(bobAddress, 1000, 18, "hello bob, i am alice, i am sending you 18 assets");
            console.log("txHash", txHash);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            const memo: TransferDetailWithMemo = await aliceChain.getTransferMemo("0xb3519bf43dbec08ef7cf5a493e5d3701cfc9ec6801f7a87889e3e3fd3a3507f4");
            console.log("memo", memo.memo);
            expect(memo.memo).toBe("hello bob, i am alice, i am sending you 18 assets");
            const txHash2 = await aliceChain.assetsTransferWithMemo(bobAddress, 1000, 18);
            console.log("txHash2", txHash2);
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            expect(txHash2).toBeTruthy();
            const memo2: TransferDetailWithMemo = await aliceChain.getTransferMemo(txHash2);
            console.log("memo2", memo2);
            expect(memo2.memo).toBe(undefined);
        }, { timeout: 30000 * 2 * 20 });

        it('should send message to bob', async () => {
            const aliceChain = await SubstrateChain.create(
                rpc,
                alicePrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(alicePrivateKey)
            );
            const bobChain = await SubstrateChain.create(
                rpc,
                bobPrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(bobPrivateKey)
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
        }, { timeout: 30000 * 2 * 20 });

        it('should get 10 transactions for bob and decrypt them', async () => {
            const bobChain = await SubstrateChain.create(
                rpc,
                bobPrivateKey,
                'sr25519',
                new SubscanApi("assethub-polkadot", subscan),
                await SR25519AES.build(bobPrivateKey)
            );
            const bobAddress = await bobChain.getMyAddress();
            if (!bobChain.subscanApi) {
                throw new Error("subscanApi is not initialized");
            }
            const transactions = await bobChain.subscanApi.addressTransferHistory(bobAddress, undefined, undefined, undefined, 0, 10);
            const transfer: TransferDetailWithMemo[] = await bobChain.subscanApi.decryptTransfersMemo(transactions, await SR25519AES.build(bobPrivateKey));
            for (const tx of transfer) {
                console.log("tx: ", JSON.stringify(tx));
            }
        }, { timeout: 30000 * 2 * 20 });
    });


});

