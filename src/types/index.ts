
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


import {EncryptedMemo} from "@eliza-dot-aes/common"


/**
 * Detailed information about a blockchain transfer transaction.
 * Contains all relevant data about a transfer including sender, recipient, amounts, fees, and optional memo.
 */
export interface TransferDetail {
    /** Unique transfer identifier */
    id: number;
    /** The extrinsic index of this transaction on the blockchain */
    extrinsic_index: string;
    /** Block number where this transaction was included */
    block_number: number;
    /** Unix timestamp of when the transaction was included in the block */
    timestamp: number;
    /** Token symbol for the transfer (defaults to "DOT" for non-asset tokens) */
    asset_symbol: string | "DOT";
    /** Unique identifier for the asset being transferred */
    asset_unique_id: string;
    /** Transaction hash of the extrinsic */
    extrinsic_hash: string;
    /** Transaction fee paid (as string to preserve precision) */
    fee: string;
    /** Whether the transaction was successful */
    success: boolean;
    /** Transfer amount value (as string to preserve precision) */
    value: string;
    /** Sender address */
    from: string;
    /** Recipient address */
    to: string;
    /** Optional memo message (can be plain text or encrypted) */
    memo?: string;
}


export type TransferType = "Send" | "Receive"

export interface TransferDetailWithMemo {
    type: TransferType;
    sender: string;
    recipient: string;
    tokenSymbol: string;
    amount: string;
    fee: string;
    // memo
    memo: string | null;
    timestamp: number;
    txId: string;
    extrinsic_index?: string;
}

/**
 * Structure for a decrypted memo message.
 * Contains the decrypted message content along with sender and recipient information.
 */
export interface DecryptedMemo {
    /** Decrypted message content */
    d: string;
    /** Sender address */
    from: string;
    /** Recipient address */
    to: string;
}

/**
 * Union type representing different forms of memo messages.
 * Can be a plain text string, an encrypted memo, or a decrypted memo structure.
 */
export type Message = string | EncryptedMemo | DecryptedMemo;


/**
 * Information about the native token of a blockchain.
 * Contains the token symbol and decimal places used for formatting amounts.
 */
export interface NativeTokenInfo {
    /** Number of decimal places for the token (e.g., 10 for DOT, 18 for ETH) */
    decimals: number;
    /** Symbol of the native token (e.g., "DOT", "KSM") */
    tokenSymbol: string;
}


 