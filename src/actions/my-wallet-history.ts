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
 * Action for retrieving wallet transaction history on Polkadot Asset Hub.
 * Fetches transfer history for the current wallet address, including encrypted memos
 * that are automatically decrypted. No input parameters required.
 * Output: transaction history with decrypted memos
 */

import {
    type Action,
    type ActionExample,
    type ActionResult,
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
import { TransferDetailWithMemo } from '../types';

/**
 * Action definition for retrieving wallet transaction history on Polkadot Asset Hub.
 * This action fetches all transfer transactions for the current wallet address,
 * decrypts any encrypted memos, and returns the complete transaction history.
 */
export const MY_WALLET_HISTORY: Action = {
    name: "MY_WALLET_HISTORY",
    similes: [
        "MY_WALLET_HISTORY",
        "MY_WALLET_HISTORY_POLKADOT",
        "MY_WALLET_HISTORY_ASSET_HUB",
        "MY_WALLET_TRANSACTION_HISTORY",
        "MY_DEPOSIT_HISTORY",
        "MY_WITHDRAW_HISTORY",
        "RECEIVED_DOT_HISTORY",
        "RECEIVED_ASSETS_HISTORY",
        "MY_MEMO_HISTORY",
        "MY_MESSAGE_HISTORY",
        "MY_ENCRYPTED_MESSAGE_HISTORY",
        "GET_MY_MESSAGES",
    ],
    description: "Get my wallet history (deposit and withdraw history, including encrypted memos) on the POLKADOT AssetHub",
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
     * Handler function that retrieves wallet transaction history.
     * Fetches transfer history from Subscan API, decrypts encrypted memos,
     * and formats the results for display.
     * 
     * @param runtime - The agent runtime instance
     * @param message - The message memory
     * @param state - The current state
     * @param _options - Optional parameters (unused)
     * @param callback - Optional callback function for returning results or errors
     * @returns true if the history is retrieved successfully, false otherwise
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
        try {
            logger.info("start to get my wallet history on the POLKADOT AssetHub");
            
            // Get the AssetHubService instance
            const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
            if (!assethubService.subscanApi || !assethubService.chain.cryptMessage) {
                throw new Error("Subscan API or cryptMessage is not initialized");
            }
            const myAddress = await assethubService.chain.getMyAddress();
            
            // Get wallet address and fetch transfer history with decrypted memos
            const history: TransferDetailWithMemo[] = await assethubService.subscanApi.decryptTransfersMemo(
                await assethubService.subscanApi.addressTransferHistory(myAddress),
                assethubService.chain.cryptMessage
            );
            
            // Format history as readable text
            const historyText = history.map((item) => {
                return `Type: ${item.type}, Sender: ${item.sender}, Recipient: ${item.recipient}, Amount: ${item.amount}, Memo: ${item.memo}, Timestamp: ${item.timestamp}, TxId: ${item.txId}`;
            }).join("\n");
            const response = {
                text: `Get my wallet history on the POLKADOT AssetHub successfully. history: \n ${historyText}`,
                content: {history},
            } satisfies Content;
            if (callback) {
                await callback(response);
            }
            logger.info(`Get my wallet history on the POLKADOT AssetHub successfully, history: \n ${historyText}`);
            return {
                success: true,
                text: response.text,
                data: {
                    address: myAddress,
                    history,
                },
            } satisfies ActionResult;
        } catch(e) {
            // Handle errors and notify via callback if available
            const errorText = `Failed to get my wallet history on the POLKADOT AssetHub. error: ${e}`;
            if (callback) {
                await callback({
                    text: errorText,
                    content: {error: errorText},
                });
            }
            logger.error(errorText);
            return {
                success: false,
                text: errorText,
                error: e instanceof Error ? e : String(e),
            } satisfies ActionResult;
        }
    },
    /** Example prompts for this action (currently empty, can be populated with example history queries) */
    examples: [
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my wallet history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my wallet history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my deposit history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my deposit history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my withdraw history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my withdraw history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],

        [
            {name: "{{name1}}",
                content: {
                    text: "Get my message history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my message history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my encrypted message history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my encrypted message history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],

        [
            {name: "{{name1}}",
                content: {
                    text: "Get my transaction history",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my transaction history now...",
                    actions: ["MY_WALLET_HISTORY"],
                },
            },
        ],
    ] as ActionExample[][],
} as Action;