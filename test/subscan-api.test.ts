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

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { SubscanApi } from '../src/common/subscan-api';
import type { TransferDetail, TransferDetailWithMemo } from '../src/types';
import { aP } from 'vitest/dist/reporters-w_64AS5f.js';

describe('SubscanApi', () => {
    const mockNetwork = 'assethub-polkadot';
    const mockApiKey = '371616121bcc4d1b8f59d4e2072135e4';
    let api: SubscanApi;

    beforeEach(() => {
        api = new SubscanApi(mockNetwork, mockApiKey);
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with correct baseUrl', () => {
            expect(api.baseUrl).toBe(`https://${mockNetwork}.api.subscan.io`);
        });

        it('should initialize with correct headers', () => {
            expect(api.headers.get('Content-Type')).toBe('application/json');
            expect(api.headers.get('x-api-key')).toBe(mockApiKey);
        });

        it('should use default API key when not provided', () => {
            const defaultApi = new SubscanApi(mockNetwork);
            expect(defaultApi.headers.get('x-api-key')).toBe('4d0c8ba32dde4a06bda83d52af49120f');
        });
    });

    describe('getExtrinsicIndexByHash', () => {
        it('should convert hash to extrinsic index', async () => {
            const mockHash = '0x3ff7b567380dcef6180b4b4db5bdb94cd4cefbef21d650cb5a0b7a96ed4d61c0';
            const mockExtrinsicIndex = '9602102-2';
            const result = await api.getExtrinsicIndexByHash(mockHash);

            expect(result).toBe(mockExtrinsicIndex);
        }, {timeout: 10000});
    });

    describe('getMemoByTransferExtrinsics', () => {
        it('should extract memo from remark transaction', async () => {
            const mockExtrinsicIndices = ["9602102-2"];
            const mockMemo = '{"e":"3hwdQ1gBP8xMQSC+Kto/5AnQFpk8D4jfXBlWuztZfxxMxbcZ+ogl0Ld/mpkMWEv/XK138bUq8RU/Q9KHyqxm8R4lbg/wG0rfPE4t9mreg0vdkCoEs4+icbBPsHclURZ+TKfB/sC+X1rRmwU/yXaPKA==","t":"sr25519","to":"15DBKxnn69eo4pYZQbD8geFXFQDC2qC51qhvBEKgEYviahit"}';

            const result = await api.getMemoByTransferExtrinsics(mockExtrinsicIndices);

            // expect(result).toHaveLength(1);
            expect(result[0].extrinsic_index).toBe('9602102-2');
            expect(result[0].memo).toBe(mockMemo);
        }, {timeout: 10000});

        it('should extract memo from remarkWithEvent transaction', async () => {
            const mockExtrinsicIndices = ["10230245-2"];
            const mockMemo = '{"e":"3hwdQ1gBP8xMQSC+Kto/5AnQFpk8D4jfXBlWuztZfxxMxbcZ+ogl0Ld/mpkMWEv/XK138bUq8RU/Q9KHyqxm8R4lbg/wG0rfPE4t9mreg0vdkCoEs4+icbBPsHclURZ+TKfB/sC+X1rRmwU/yXaPKA==","t":"sr25519","to":"15DBKxnn69eo4pYZQbD8geFXFQDC2qC51qhvBEKgEYviahit"}';

            const result = await (api as any).getMemoByTransferExtrinsics(mockExtrinsicIndices);
            expect(result[0].memo).toBe(mockMemo);
        }, {timeout: 10000});

        it('should return undefined memo when no remark found', async () => {
            const mockExtrinsicIndices = ['10229852-2'];
            const result = await api.getMemoByTransferExtrinsics(mockExtrinsicIndices);
            expect(result[0].memo).toBeUndefined();
        }, {timeout: 10000});

        it('should return undefined memo when params structure is different', async () => {
            const mockExtrinsicIndices = ['10230310-2'];

            const result = await api.getMemoByTransferExtrinsics(mockExtrinsicIndices);

            // expect(result).toHaveLength(1);
            expect(result[0].memo).toBeUndefined();
        }), {timeout: 10000};

        it('should handle batch of extrinsic indices', async () => {
            const mockExtrinsicIndices = ['10230245-2', '9602102-2'];
            const result = await api.getMemoByTransferExtrinsics(mockExtrinsicIndices);

            expect(result).toHaveLength(2);
        });
    }, {timeout: 10000});

    describe('addressTransferHistory', () => {
        it('should fetch transfer history for an address', async () => {
            const mockAddress = '13GKHvBFjWuVjezV8cG6DMoK2FftY4awXXqKdunApnJGbvwd';

            const result = await api.addressTransferHistory(mockAddress);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should fetch transfer history by extrinsic index', async () => {
            const mockExtrinsicIndex = '10230478-2';
            const result = await api.addressTransferHistory(null, mockExtrinsicIndex);

            expect(result).toHaveLength(1);
            expect(result[0].extrinsic_index).toBe(mockExtrinsicIndex);
        }, {timeout: 10000});

    describe('getTransferByHash', () => {
        it('should retrieve transfer details by hash', async () => {
            const mockHash = '0xa09de785bc38e5650553383067b8cb910c021645e50058b1077073ac9166e3d2';
            const mockExtrinsicIndex = '10230478-2';
            const result = await api.getTransferByHash(mockHash);

            expect(result).toBeTruthy();
            expect((result as TransferDetailWithMemo).txId).toBe(mockHash);
            expect(result!.extrinsic_index).toBe(mockExtrinsicIndex);
        });
    }, {timeout: 10000});

    }, {timeout: 10000});
});
