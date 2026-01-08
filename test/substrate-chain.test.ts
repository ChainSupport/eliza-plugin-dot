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

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
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
    let AliceSubstrateChain: SubstrateChain;
    let BobSubstrateChain: SubstrateChain;
    beforeAll(async () => {
        AliceSubstrateChain = await SubstrateChain.create(
            ASSETHUB_RPC_URL,
            ALICE_PRIVATE_KEY,
            'sr25519',
            new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
            await SR25519AES.build(ALICE_PRIVATE_KEY)
        );
        console.log("init Alice chain")
        BobSubstrateChain = await SubstrateChain.create(
            ASSETHUB_RPC_URL,
            BOB_PRIVATE_KEY,
            'sr25519',
            new SubscanApi("assethub-polkadot", SUBSCAN_API_KEY),
            await SR25519AES.build(BOB_PRIVATE_KEY)
        );
        console.log("init Bob chain")
        subscanApi = new SubscanApi(mockNetwork, SUBSCAN_API_KEY);
        console.log("init subscanApi")
        cryptMessage = await SR25519AES.build(ALICE_PRIVATE_KEY);
        console.log("init cryptMessage")

    });

    describe('create', () => {
        it('should create and initialize SubstrateChain with all parameters', { timeout: 300000 }, async () => {

            expect(AliceSubstrateChain).toBeDefined();
            const blockHeight = await AliceSubstrateChain.getLatestBlockHeight();
            expect(blockHeight).toBeGreaterThan(0);
            expect(AliceSubstrateChain.api).toBeDefined();
            expect(AliceSubstrateChain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(AliceSubstrateChain.keyPairType).toBe('sr25519');
            // expect(AliceSubstrateChain.subscanApi).toBe(subscanApi);
            
            // Verify chain properties are initialized
            const chainName = AliceSubstrateChain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            const ss58Format = AliceSubstrateChain.getSs58Format();
            expect(ss58Format).toBe(0);
            
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

            const chainName = AliceSubstrateChain.getChainName();
            expect(chainName).toBe(mockNetwork);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should initialize SS58 format correctly', { timeout: 300000 }, async () => {

            const ss58Format = AliceSubstrateChain.getSs58Format();
            expect(ss58Format).toBe(0);
        }, );

        it('should not be Ethereum chain', { timeout: 300000 }, async () => {
            const isEthereum = await AliceSubstrateChain.isEthereumChain();
            expect(isEthereum).toBe(false);
            
            // Cleanup
            // await chain.api.disconnect();
        }, );

        it('should validate initialization parameters', { timeout: 300000 }, async () => {

            // Verify all initialization parameters are set correctly
            expect(AliceSubstrateChain.getRpcUrl()).toBe(ASSETHUB_RPC_URL);
            expect(AliceSubstrateChain.keyPairType).toBe('sr25519');
            // expect(AliceSubstrateChain.subscanApi).toBe(subscanApi);
        }, );

        // it('should throw error when RPC URL is invalid', { timeout: 300000 }, async () => {
        //     const invalidRpcUrl = 'wss://invalid-rpc-url-that-does-not-exist.com/ws';
            
        //     await expect(
        //         SubstrateChain.create(invalidRpcUrl, ALICE_PRIVATE_KEY)
        //     ).rejects.toThrow();
        // }, );

        it('should handle different keypair types', { timeout: 300000 }, async () => {

            expect(AliceSubstrateChain.keyPairType).toBe('sr25519');
            
        }, );
    });

    describe('getMyAddress', () => {
        it('should derive address from private key', { timeout: 300000 }, async () => {

            const address = await AliceSubstrateChain.getMyAddress();
            expect(address).toBeTruthy();
            expect(typeof address).toBe('string');
            expect(address.length).toBeGreaterThan(0);
            // Cleanup
            // await chain.api.disconnect();
        }, );
    });

    describe('validateAddress', () => {
        it('should validate correct Substrate address', { timeout: 300000 }, async () => {
            // First get a valid address
            const validAddress = await AliceSubstrateChain.getMyAddress();
            const isValid = AliceSubstrateChain.validateAddress(validAddress);
            expect(isValid).toBe(true);
            
            // Cleanup
            await AliceSubstrateChain.api.disconnect();
        }, );

        it('should reject invalid address', { timeout: 300000 }, async () => {
            const invalidAddress = 'invalid-address-string';
            const isValid = AliceSubstrateChain.validateAddress(invalidAddress);
            expect(isValid).toBe(false);
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
            const publicKey = await AliceSubstrateChain.getAddressPublicKey(await AliceSubstrateChain.getMyAddress());
            console.log("publicKey", publicKey);

            await expect(AliceSubstrateChain.getAddressPublicKey("error" as any)).rejects.toThrow();
        });
    }, );


    describe('getMyBalance', () => {
        it('should get my balance for native token', {timeout: 300000}, async () => {
            
            const balance = await AliceSubstrateChain.getUserBalance(await AliceSubstrateChain.getMyAddress());
            const balance2 = await AliceSubstrateChain.getUserBalance("error" as any);
            console.log("balance2", balance2);
            expect(balance2).toBe(BigInt(0));
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(0);
        });

        it('should get my balance for asset', {timeout: 300000}, async () => {
            const balance = await AliceSubstrateChain.getUserBalance(await AliceSubstrateChain.getMyAddress(), 18);
            console.log("balance", balance);
            expect(balance).toBeGreaterThan(BigInt(0));
        });

        it('should get assets decimals', {timeout: 300000}, async () => {
            
            const decimals = await AliceSubstrateChain.getAssetsDecimals(18);
            console.log("decimals", decimals);
            expect(decimals).toBe(4)
            
            const decimals2 = await AliceSubstrateChain.getAssetsDecimals(null);
            console.log("decimals2", decimals2);
            expect(decimals2).toBe(10);

            await expect(AliceSubstrateChain.getAssetsDecimals("error" as any)).rejects.toThrow();
        });
    });

    describe.sequential('transferWithMemo', { timeout: 30000 * 2 * 20 }, () => {
        const memoToBob = "hello bob, i am alice, i am sending you 0.01 DOT";
        const memoToBobDota = "hello bob, i am alice, i am sending you 0.1 DOTA";
        const memoToBobMessage = "hello bob, i am alice, i am sending you a message";
        var dotTransferTxHash1: string;
        let dotTransferTxHash2: string;
        let dotaTransferTxHash1: string;
        let dotaTransferTxHash2: string;
        let messageTransferTxHash1: string;
        let messageTransferTxHash2: string;

        it('should transfer DOT with memo', async () => {
            const bobAddress = await BobSubstrateChain.getMyAddress();
   
            await expect(AliceSubstrateChain.transferWithMemo("invalid-address-string", BigInt(120000), memoToBob)).rejects.toThrow();
            dotTransferTxHash1 = await AliceSubstrateChain.transferWithMemo(bobAddress, BigInt(120000), "hello bob, i am alice, i am sending you 0.01 DOT");

            // await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
            // 不发送任何memo 解析出来应该是 undefined
            dotTransferTxHash2 = await AliceSubstrateChain.transferWithMemo(bobAddress, BigInt(120000));
            // await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

        }, );

        it('should transfer asset with memo', { timeout: 30000 * 2 * 20 }, async () => {
            const bobAddress = await BobSubstrateChain.getMyAddress();
            await expect(AliceSubstrateChain.assetsTransferWithMemo("invalid-address-string", BigInt(1000), 18, memoToBobDota)).rejects.toThrow();
            dotaTransferTxHash1 = await AliceSubstrateChain.assetsTransferWithMemo(bobAddress, BigInt(1000), 18, memoToBobDota);
            // await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
            dotaTransferTxHash2 = await AliceSubstrateChain.assetsTransferWithMemo(bobAddress, BigInt(1000), 18);
            // await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
        }, );

        it('should send message to bob', { timeout: 30000 * 2 * 20 }, async () => {
            const bobAddress = await BobSubstrateChain.getMyAddress();
            // const aliceAddress = await AliceSubstrateChain.getMyAddress(); 
            await expect(AliceSubstrateChain.sendMessage(bobAddress, "")).rejects.toThrow();
            messageTransferTxHash1 = await AliceSubstrateChain.sendMessage(bobAddress, memoToBobMessage);
            // await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
        }, );

        it('should get 10 transactions for bob and decrypt them', { timeout: 30000 * 2 * 20 }, async () => {
           
            const bobAddress = await BobSubstrateChain.getMyAddress();
            if (!BobSubstrateChain.subscanApi) {
                throw new Error("subscanApi is not initialized");
            }
            const transactions = await BobSubstrateChain.subscanApi.addressTransferHistory(bobAddress, undefined, undefined, undefined, 0, 10);
            const transfer: TransferDetailWithMemo[] = await BobSubstrateChain.subscanApi.decryptTransfersMemo(transactions, await SR25519AES.build(BOB_PRIVATE_KEY));
            for (const tx of transfer) {
                console.log("tx: ", JSON.stringify(tx));
            }
        }, );

        // 获取上述转账消息并解密memo
        it('should get the transfer messages and decrypt the memo', { timeout: 30000 * 2 * 20 }, async () => {
            // 等待3分钟
            await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000)); 
            // alice和bob均可以解密
            const memo: TransferDetailWithMemo = await AliceSubstrateChain.getTransferMemo(dotTransferTxHash1);
            expect(memo.memo).toBe(memoToBob);
            const bobMemo: TransferDetailWithMemo = await BobSubstrateChain.getTransferMemo(dotTransferTxHash1);
            expect(bobMemo.memo).toBe(memoToBob);

            const memo2: TransferDetailWithMemo = await AliceSubstrateChain.getTransferMemo(dotTransferTxHash2);
            expect(memo2.memo).toBe(undefined);

            const memo3: TransferDetailWithMemo = await AliceSubstrateChain.getTransferMemo(dotaTransferTxHash1);
            expect(memo3.memo).toBe(memoToBobDota);

            const memo4: TransferDetailWithMemo = await AliceSubstrateChain.getTransferMemo(dotaTransferTxHash2);
            expect(memo4.memo).toBe(undefined);


            const memo5: TransferDetailWithMemo = await AliceSubstrateChain.getTransferMemo(messageTransferTxHash1);
            expect(memo5.memo).toBe(memoToBobMessage);
        },);


    });


});

