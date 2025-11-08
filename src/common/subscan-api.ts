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


import {Message, TransferDetailWithMemo, TransferDetail } from "../types";
import {convertJsonToEncryptedMemo, EncryptedMemo, ICryptMessage} from "@eliza-dot-aes/common"

/**
 * Interface representing extrinsic parameters with memo message.
 * Used to store the association between an extrinsic index and its memo message.
 */
interface ExtrinsicParamsWithMemo{
    extrinsic_index: string;
    memo: Message;
} 

/**
 * Options interface for making HTTP requests to the Subscan API.
 * Defines the structure for request configuration including method, headers, body, and redirect policy.
 */
export interface RequestOptions {
    method: "POST" | "GET";
    headers: Headers;
    params?: Record<string, string>;
    body?: string;
    redirect?: "follow";
}

/**
 * Client class for interacting with the Subscan API.
 * Provides methods to query blockchain data including transfers, extrinsics, and memos.
 * Supports multiple networks through the network parameter in the constructor.
 */
export class SubscanApi {
    public baseUrl: string;
    public headers: Headers;
    constructor(public network: string, public apiKey: string = "4d0c8ba32dde4a06bda83d52af49120f") {
        this.baseUrl = `https://${network}.api.subscan.io`;
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('x-api-key', apiKey);
        this.headers = headers;
    
    }


    /**
     * Retrieves transfer details by transaction hash.
     * First converts the hash to an extrinsic index, then fetches the transfer information.
     * 
     * @param hash - The transaction hash of the transfer
     * @returns Promise resolving to the TransferDetail object, or null if not found
     * @throws Error if the API request fails or the hash is invalid
     */
    public async getTransferByHash(hash: string): Promise<TransferDetailWithMemo> {
        try {
            const extrinsicIndex = await this.getExtrinsicIndexByHash(hash);
            // 根据交易索引获取转账交易
            const transfer = await this.addressTransferHistory(undefined, extrinsicIndex);
            return transfer[0] ?? null;
        } catch(e) {
            throw e;
        }
    }

    /**
     * Decrypts memo messages for a batch of transfer transactions.
     * Iterates through all transfers and attempts to decrypt their memos using the provided encryption service.
     * If a memo is null or decryption fails, the original memo value is preserved.
     * 
     * @param transfers - Array of transfer details with potentially encrypted memos
     * @param cryptMessage - Encryption service instance used for decrypting memo messages
     * @returns Promise resolving to an array of transfer details with decrypted memos
     *          Each transfer's memo will be decrypted if possible, otherwise kept as original (null or encrypted string)
     * @throws Error if the decryption service is invalid or encounters critical errors
     */
    public async decryptTransfersMemo(transfers: TransferDetailWithMemo[], cryptMessage: ICryptMessage): Promise<TransferDetailWithMemo[]> {
        const txs = transfers.map(async (transfer) => {
            try {
                const memoJson: EncryptedMemo = convertJsonToEncryptedMemo(transfer.memo);
                transfer.memo = await cryptMessage.decryptMessage(memoJson.e);

            } catch (e) {
                transfer.memo = transfer.memo;
            }
            return transfer;
        });
        const result = await Promise.all(txs);
        return result;
    }

    /**
     * Retrieves transfer history for an address or by extrinsic index.
     * Fetches transfer transactions and enriches them with memo messages if available.
     * Supports pagination and filtering by various parameters.
     * 
     * @param address - The account address to query (optional if extrinsic_index is provided)
     * @param extrinsic_index - Specific extrinsic index to query (optional)
     * @param asset_symbol - Asset symbol to filter by (currently not supported by API)
     * @param asset_unique_id - Unique asset identifier to filter by
     * @param page - Page number for pagination (default: 0)
     * @param row - Number of results per page (default: 20)
     * @param filter_nft - Whether to filter NFT transfers (currently not supported by API)
     * @param success - Whether to include only successful transactions (default: true)
     * @returns Promise resolving to an array of TransferDetail objects with memo information
     * @throws Error if the API request fails
     */
    public async addressTransferHistory(address: string | null, extrinsic_index: string | undefined = undefined, asset_symbol: string | undefined = undefined, asset_unique_id: string | undefined = undefined, page: number = 0, row: number = 20, filter_nft: boolean = true, success: boolean = true): Promise<TransferDetailWithMemo[]> {
        try {
            const url = `${this.baseUrl}/api/v2/scan/transfers`;
            const options: RequestOptions = {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    "address": address,
                    "row": row,
                    "page": page,
                    "success": success,
                    "extrinsic_index": extrinsic_index,
                    "asset_unique_id": asset_unique_id,
                }),
                redirect: "follow",
            };

            const response = await fetch(url, options);
            const data = await response.json();
            const memos = await this.getMemoByTransferExtrinsics((data as any).data.transfers.map((item: any) => item.extrinsic_index));
            const transfers = (data as any).data.transfers.map((item: any) => {
            
                return {
                    id: item.transfer_id,
                    extrinsic_index: item.extrinsic_index,
                    extrinsic_hash: item.hash,
                    block_number: item.block_num,
                    asset_unique_id: item.asset_unique_id,
                    asset_symbol: item.asset_symbol,
                    xtrinsic_hash: item.hash,
                    fee: (item.fee / 10 ** 10).toString() + " DOT",
                    success: item.success,
                    value: item.amount,
                    from: item.from,
                    to: item.to,
                    amount: item.amount,
                    timestamp: item.block_timestamp,
                    memo: memos.find((i) => i.extrinsic_index === item.extrinsic_index)?.memo,
                }
                
            }).map((item: TransferDetail) => {
                return {
                    type: item.from === address ? "Send" : "Receive",
                    sender: item.from,
                    recipient: item.to,
                    tokenSymbol: item.asset_symbol,
                    amount: item.value,
                    memo: item.memo,
                    fee: item.fee,
                    timestamp: item.timestamp,
                    txId: item.extrinsic_hash,
                    extrinsic_index: item.extrinsic_index,
                }
            })
            return transfers;
        } catch(e) {
            throw e;
        }
    }

    /**
     * Converts a transaction hash to an extrinsic index.
     * This is a private helper method used internally to query extrinsic details by hash.
     * 
     * @param hash - The transaction hash to look up
     * @returns Promise resolving to the extrinsic index string
     * @throws Error if the hash is not found or the API request fails
     */
    public async getExtrinsicIndexByHash(hash: string): Promise<string> {
        try {
            const url = `${this.baseUrl}/api/scan/extrinsic`;
            const options: RequestOptions = {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    "hash": hash,
                }),
                redirect: "follow",
            };
            const response = await fetch(url, options);
            const data: any = await response.json();
            return data.data.extrinsic_index;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    /**
     * Retrieves memo messages for a batch of extrinsic indices.
     * Parses extrinsic parameters to extract memo messages from System.remark or System.remarkWithEvent calls.
     * Handles batch transactions by checking the last call in the batch.
     * 
     * @param extrinsic_index - Array of extrinsic indices to query for memos
     * @returns Promise resolving to an array of ExtrinsicParamsWithMemo objects
     *          Each object contains the extrinsic_index and associated memo (if found)
     * @throws Error if the API request fails
     */
    public async getMemoByTransferExtrinsics(extrinsic_index: string[]): Promise<ExtrinsicParamsWithMemo[]> {
        try {
            const url = `${this.baseUrl}/api/scan/extrinsic/params`;
            const options: RequestOptions = {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    "extrinsic_index": extrinsic_index,
                }),
                redirect: "follow",

            };
            const response = await fetch(url, options);
            // console.log("response", JSON.stringify(response));
            const data: any = await response.json();
            // console.log("getMemoByTransferExtrinsics", JSON.stringify(data));
            const exs = data.data.map((item: any) => {
                const index = item.extrinsic_index;
                if (item.params.length == 1 && item.params[0].name === "calls" ) {
                    const batch_all_value = item.params[0].value;
                    const last_call = batch_all_value.at(-1);
                    if (last_call.call_module === "System" && (last_call.call_name === "remark_with_event" || last_call.call_name === "remark")) {
                        const transfer_with_memo_params = last_call.params[0].value.toString();
                        return {
                            extrinsic_index: index,
                            memo: transfer_with_memo_params,
                        }
                    }   
                }
                return {
                    extrinsic_index: index,
                    memo: undefined,
                }
            });
            return exs;
        } catch(e) {
            throw e;
        }

    }


}

