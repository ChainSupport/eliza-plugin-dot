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
 * Action for retrieving current wallet information on Polkadot Asset Hub.
 * Fetches wallet address and native DOT balance for the current account.
 * No input parameters required.
 * Output: wallet address and balance information
 */

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
 * Content interface for wallet info query.
 * Extends the base Content interface with address and balance fields.
 */
interface GetMyWalletInfoContent extends Content {
    /** The wallet address. */
    address: string;
    /** The wallet balance as a string. */
    balance: string;
}

// No template needed - this action doesn't require LLM extraction as it directly queries wallet info

/**
 * Action definition for retrieving current wallet information on Polkadot Asset Hub.
 * This action directly queries the blockchain for the current wallet's address
 * and native DOT balance without requiring user input.
 */
export const GET_MY_WALLET_INFO: Action = {
    name: "GET_MY_WALLET_INFO",
    similes: [
        "GET_MY_WALLET_INFO",
        "GET_MY_WALLET_INFO_POLKADOT",
        "GET_MY_WALLET_INFO_ASSET_HUB",
        "MY_DOT_BALANCE",
        "MY_NATIVE_DOT_BALANCE",
        "MY_WALLET_ADDRESS",
        "MY_WALLET_BALANCE",
    ],
    description: "Get my wallet info on the POLKADOT AssetHub",
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
     * Handler function that retrieves current wallet information.
     * Queries the blockchain for wallet address and native DOT balance,
     * then converts the balance to human-readable format.
     * 
     * @param runtime - The agent runtime instance
     * @param message - The message memory
     * @param state - The current state
     * @param _options - Optional parameters (unused)
     * @param callback - Optional callback function for returning results or errors
     * @returns true if the wallet info is retrieved successfully, false otherwise
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
        try {
            logger.info("start to get my wallet info on the POLKADOT AssetHub");
            
            // Get the AssetHubService instance
            const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
            
            // Get wallet address
            const address = await assethubService.chain.getMyAddress();
            
            // Get native DOT balance
            const balance = await assethubService.chain.getUserBalance(address);
            
            // Get decimals for balance conversion
            const decimals = await assethubService.chain.getAssetsDecimals(null);
            
            // Convert balance from raw format to human-readable format
            const amount = balance / BigInt(10 ** decimals);
            if (callback) {
                callback({
                    text: `My wallet address is ${address}, and my balance is ${amount.toString()}`,
                    content: {address: address, balance: balance.toString()},
                });
            }
            logger.info(`Get my wallet info on the POLKADOT AssetHub successfully, address: ${address}, balance: ${balance.toString()}`);
            return true;
        } catch(e) {
            // Handle errors and notify via callback if available
            logger.error(`Failed to get my wallet info on the POLKADOT AssetHub`);
            if (callback) {
                callback({
                    text: `Failed to get my wallet info on the POLKADOT AssetHub`,
                    content: {error: `Failed to get my wallet info on the POLKADOT AssetHub`},
                });
            }
            return false;
        }
    },
    /** Example prompts for this action (currently empty, can be populated with example wallet info queries) */
    examples: [
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my wallet info",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my wallet info now...",
                    actions: ["GET_MY_WALLET_INFO"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my address and native DOT balance",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my address and native DOT balance now...",
                    actions: ["GET_MY_WALLET_INFO"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my address",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my address now...",
                    actions: ["GET_MY_WALLET_INFO"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Get my native DOT balance",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting my native DOT balance now...",
                    actions: ["GET_MY_WALLET_INFO"],
                },
            },
        ],
    ] as ActionExample[][],
} as Action;