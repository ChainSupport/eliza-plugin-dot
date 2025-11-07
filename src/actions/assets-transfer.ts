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

/**
 * Action for transferring assets or native DOT on Polkadot Asset Hub.
 * Supports transferring both native DOT and assets (tokens) with optional encrypted memos.
 * Input parameters: assetId (null for DOT), recipient address, amount, and optional memo
 * Output: transaction hash upon successful transfer
 */

import { checkAddress} from "@polkadot/util-crypto";
import {
    type Action,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelType,
    type State,
    composePromptFromState,
    logger,
    parseJSONObjectFromText,
  } from '@elizaos/core';
import {AssetHubService} from '../assethub-service';
  
/**
 * Content interface for asset transfer.
 * Extends the base Content interface with transfer-specific fields.
 */
interface TransferContent extends Content {
    /** The asset ID to transfer. Use null for native DOT transfers. */
    assetId: number | null;
    /** The recipient wallet address. */
    recipient: string;
    /** The transfer amount. */
    amount: number;
    /** Optional memo message to encrypt and attach to the transfer. */
    memo: string | null;
  }

/**
 * Validates the transfer content.
 * Checks if assetId is a valid number (when provided), recipient is a valid address,
 * and amount is a valid number.
 * 
 * @param content - The TransferContent object to validate
 * @returns true if the content is valid, false otherwise
 */
function validateTransferContent(content: TransferContent): boolean {
    if (content.assetId != null) {
        return typeof content.assetId == "number"
    }

    if (content.recipient == null || content.amount == null) {
        return false;
    }

    return checkAddress(content.recipient, 0)[0] && typeof content.amount == "number";
}

/**
 * Template string for prompting the LLM to extract transfer information.
 * Provides examples for different transfer scenarios:
 * - Asset transfers with memo
 * - Native DOT transfers with memo
 * - Transfers without memo
 */
const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Tip: USDT's assetId is 1984, USDC's assetId is 1337
    Example responses:
    Transfer Assets:
    \`\`\`json
    {
        "assetId": 1984,
        "recipient": "14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        "amount": 1000,
        "memo": "Hello, how are you?"
    }
    \`\`\`

    Transfer native DOT:
    \`\`\`json
    {
        "assetId": null,
        "recipient": "14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        "amount": 1.5
        "memo": "Hello, how are you?"
    }
    \`\`\`

    Transfer with no memo:
    \`\`\`json
    {
        "assetId": 1984,
        "recipient": "14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        "amount": 1000,
        "memo": null
    }
    \`\`\`

    {{recentMessages}}

    Extract the following information about the requested transfer:
    - Asset ID (use null for DOT transfers)
    - Recipient wallet address
    - Amount 
    - Memo (use null for no memo)
    `;

/**
 * Action definition for transferring assets or native DOT on Polkadot Asset Hub.
 * This action allows users to transfer either native DOT or specific assets to any address,
 * with optional encrypted memo messages. The action validates balance before transfer
 * and handles both native token and asset transfers.
 */
export const TRANSFER_ASSETS: Action = {
name: "TRANSFER_ASSETS",
similes:[
    'TRANSFER_DOT',
    "TRANSFER_ASSETS",
    'SEND_TOKEN_POLKADOT_ASSET_HUB',
    'TRANSFER_TOKEN_POLKADOT_ASSET_HUB',
    'SEND_TOKENS_POLKADOT_ASSET_HUB',
    'TRANSFER_TOKENS_POLKADOT_ASSET_HUB',
    "SEND_ASSETS_POLKADOT_ASSET_HUB",
    "TRANSFER_ASSETS_POLKADOT_ASSET_HUB",
    "PAY_DOT",
    "PAY_ASSETS",
    "PAY_TOKEN",
    "WITHDRAW_DOT",
    "WITHDRAW_ASSETS",
    "WITHDRAW_TOKEN",
    ],
description: "Transfer My assets or native DOT to other users on the POLKADOT AssetHub",
/**
 * Validates that the AssetHubService is available in the runtime.
 * 
 * @param runtime - The agent runtime instance
 * @param message - The message memory
 * @param state - The current state
 * @param _option - Optional parameters (unused)
 * @param callback - Optional callback function
 * @returns true if AssetHubService is available, false otherwise
 */
validate: async (runtime: IAgentRuntime, message: Memory, state: State, _option: {
    [key: string]: unknown;
}, callback?: HandlerCallback) => {
    const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
    return !!assethubService
},
/**
 * Handler function that processes the transfer request.
 * Uses LLM to extract transfer parameters from user input, validates balance,
 * and executes the transfer on the Polkadot Asset Hub blockchain.
 * 
 * @param runtime - The agent runtime instance
 * @param message - The message memory
 * @param state - The current state
 * @param _options - Optional parameters (unused)
 * @param callback - Optional callback function for returning results or errors
 * @returns true if the transfer succeeds, false otherwise
 */
handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
    try {
        logger.info("start to transfer assets or native DOT on the POLKADOT AssetHub");
        
        // Compose prompt from state and template
        const transferPrompt = composePromptFromState({
            state: state,
            template: transferTemplate,
        });

        // Use LLM to extract transfer parameters from user input
        const result = await runtime.useModel(ModelType.TEXT_LARGE, {
            prompt: transferPrompt,
        });

        // Parse the JSON response from LLM
        const content = parseJSONObjectFromText(result) as TransferContent;
        
        // Validate the extracted content
        if (!validateTransferContent(content)) {
    if (callback) {
            callback({
                text: `Invalid assetId, recipient, or amount: ${content.assetId}, ${content.recipient}, ${content.amount}`,
                content: {error: `Invalid assetId, recipient, or amount: ${content.assetId}, ${content.recipient}, ${content.amount}`},
            });
        }
        logger.warn(`Invalid assetId, recipient, or amount: ${content.assetId}, ${content.recipient}, ${content.amount}`);
        return false;
    }
    
    // Get the AssetHubService instance
    const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
    
    // Check balance before transfer
    const balance = await assethubService.chain.getUserBalance(await assethubService.chain.getMyAddress(), content.assetId);
    
    // Get asset decimals for amount conversion
    const decimals = await assethubService.chain.getAssetsDecimals(content.assetId);
    
    // Convert amount to raw balance (multiply by 10^decimals) and check if sufficient
    if (balance < BigInt(content.amount * 10**decimals)) {
        if (callback) {
            callback({
                text: `Insufficient balance. Your ${content.assetId == null ? "DOT" :"asset "+content.assetId} balance: ${balance}` ,
                content: {error: `Insufficient balance. Your ${content.assetId == null ? "DOT" :"asset "+content.assetId} balance: ${balance}`},
            });
        }
        logger.warn(`Insufficient balance. Your ${content.assetId == null ? "DOT" :"asset "+content.assetId} balance: ${balance}`);
        return false;
    }

    // Execute transfer based on asset type
    let txHash: string;
    if (content.assetId == null) {
        // Transfer native DOT
        txHash = await assethubService.chain.transferWithMemo(content.recipient, content.amount, content.memo);
    } else {
        // Transfer asset (token)
        txHash = await assethubService.chain.assetsTransferWithMemo(content.recipient, content.amount, content.assetId, content.memo);
    }
    if (callback) {
        callback({
            text: `Transfer ${content.assetId == null ? "DOT" :"asset "+content.assetId} to ${content.recipient} successfully, txHash is ${txHash}`,
            content: {txHash: txHash, assetId: content.assetId == null ? "DOT" :"asset "+content.assetId, recipient: content.recipient, amount: content.amount, memo: content.memo},
        });
    }
    logger.info(`Transfer ${content.assetId == null ? "DOT" :"asset "+content.assetId} to ${content.recipient} successfully, txHash: ${txHash}`);
    return true;

    } catch (e) {
        // Handle errors and notify via callback if available
        logger.error(`Failed to transfer assets or native DOT on the POLKADOT AssetHub. error: ${e}`);
        if (callback) {
            callback({
                text: `Failed to transfer assets or native DOT on the POLKADOT AssetHub. error: ${e}`,
                content: {error: `Failed to transfer assets or native DOT on the POLKADOT AssetHub. error: ${e}`},
            });
        }
        return false;
    }
    
},
/** Example prompts for this action (currently empty, can be populated with example transfer queries) */
examples: [
    [{
        name: '{{name1}}',
        content: {
            text: "Send 8.88 DOT to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        }
    },
    {
        name: '{{name2}}',
        content: {
            text: "Sending DOT to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
            actions: [""]
        }
    },],
    [
        {
            name: "{{name1}}",
            content: {
                text: "Transfer 1.2 USDT to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
                actions: ["TRANSFER_ASSETS"]
            },
        },
        {
            name: "{{name2}}",
            content: {
                text: "Transfer 1.2 USDT to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
                actions: ["TRANSFER_ASSETS"]
            },

        }
    ],
    [
        {
            name: "{{name1}}",
            content: {
                text: "Send 1.0 Asset 1984 to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
            },
        },
        {
            name: "{{name2}}",
            content: {
                text: "Sending Asset 1984 to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
                actions: ["TRANSFER_ASSETS"]
            },
        }
    ],
] as ActionExample[][],


} as Action;



