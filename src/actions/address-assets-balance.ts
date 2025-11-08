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
 * Action for querying balance of any address on Polkadot Asset Hub.
 * Supports querying both native DOT balance and asset balances.
 * Input parameters: address (optional, null for own address) and assetId (optional, null for native DOT)
 * Output: balance information including address, assetId, decimals, and balance value
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
import { checkAddress} from "@polkadot/util-crypto";

/**
 * Content interface for address assets balance query.
 * Extends the base Content interface with address and assetId fields.
 */
interface AddressAssetsBalanceContent extends Content {
    /** The address to query balance for. Use null to query own address. */
    address: string | null;
    /** The asset ID to query. Use null for native DOT balance. */
    assetId: number | null;
}

/**
 * Validates the address assets balance content.
 * Checks if the address is valid (when provided) and if assetId is a valid number (when provided).
 * 
 * @param content - The AddressAssetsBalanceContent object to validate
 * @returns true if the content is valid, false otherwise
 */
function validateAddressAssetsBalanceContent(runtime: IAgentRuntime,    content: AddressAssetsBalanceContent): boolean {
    if (content.address !== null && content.address.trim() !== "") {
        if (!checkAddress(content.address.trim(), 0)[0]) {
            runtime.logger.warn(`address ${content.address.trim()} is not a valid address`);
            return false;
        }
    }
    content.assetId = content.assetId === null ? null : Number(content.assetId.toString().trim());
    return true;
}

/**
 * Template string for prompting the LLM to extract address and assetId information.
 * Provides examples for different query scenarios:
 * - User's asset balance
 * - Own asset balance
 * - User's native DOT balance
 * - Own native DOT balance
 */
const addressAssetsBalanceTemplate = `
    Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Tip: USDT's assetId is 1984, USDC's assetId is 1337, DOTA's assetId is 18
    Example responses:
    For user's POLKADOT AssetHub assets (tokens) balance:
    \`\`\`json
    {
        "address": "14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        "assetId": 1984
    }
    \`\`\`

    For my POLKADOT AssetHub assets balance:
    \`\`\`json
    {
        "address": null,
        "assetId": 1984
    }
    \`\`\`

    For user's native DOT balance:
    \`\`\`json
    {
        "address": 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe,
        "assetId": null
    }
    \`\`\`

    For My native DOT balance:
    \`\`\`json
    {
        "address": null,
        "assetId": null
    }
    \`\`\`

    {{recentMessages}}
    Extract the following information about the requested balance:
    - Address (use null for my address)
    - Asset ID (use null for DOT balance) , type must be number or null, not string
    `;

/**
 * Action definition for querying address assets balance on Polkadot Asset Hub.
 * This action allows users to query balance for any address (or their own address)
 * for either native DOT or specific assets by assetId.
 */
export const USER_ASSETS_BALANCE: Action = {
    name: "USER_ASSETS_BALANCE",
    similes: [
        "ADDRESS_BALANCE",
        "USER_BALANCE",
        "ADDRESS_DOT_BALANCE",
        "USER_DOT_BALANCE",
        "ADDRESS_ASSETS_BALANCE",
        "USER_ASSETS_BALANCE",
        "USER_ASSETS_BALANCE_POLKADOT",
        "MY_ASSETS_BALANCE",
        "MY_DOT_BALANCE",
        "NATIVE_DOT_AMOUNT",
        "NATIVE_DOT_BALANCE",
        "ASSETS_AMOUNT",
        "ASSETS_BALANCE",

    ],
    description: "Get the user's or my DOT or assets balance on the POLKADOT AssetHub",
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
        // Service must exist
        const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
        return !!assethubService
    },

    /**
     * Handler function that processes the balance query request.
     * Uses LLM to extract address and assetId from user input, then queries the balance
     * from the Polkadot Asset Hub blockchain. The balance is converted to human-readable
     * format using the asset's decimals.
     * 
     * @param runtime - The agent runtime instance
     * @param message - The message memory
     * @param state - The current state
     * @param _options - Optional parameters (unused)
     * @param callback - Optional callback function for returning results or errors
     * @returns true if the query succeeds, false otherwise
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
        try {
            runtime.logger.info("start to get user's or your own DOT or assets balance on the POLKADOT AssetHub");
            
            // Compose prompt from state and template
            const addressAssetsBalancePrompt = composePromptFromState({
                state: state,
                template: addressAssetsBalanceTemplate,
            });
            
            // Use LLM to extract address and assetId from user input
            const result = await runtime.useModel(ModelType.TEXT_LARGE, {
                prompt: addressAssetsBalancePrompt,
            });
            
            // Parse the JSON response from LLM
            const content = parseJSONObjectFromText(result) as AddressAssetsBalanceContent;
            
            // Validate the extracted content
            if (!validateAddressAssetsBalanceContent(runtime,content)) {
                const errorText = `Invalid address or assetId: ${content.address}, ${content.assetId}`;
                if (callback) {
                    await callback({
                        text: errorText,
                        content: {error: errorText},
                    });
                }
                runtime.logger.warn(errorText);
                return {
                    success: false,
                    text: errorText,
                    error: errorText,
                } satisfies ActionResult;
            }

            // Get the AssetHubService instance
            const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);

            // Get asset decimals for balance conversion
            const decimals = await assethubService.chain.getAssetsDecimals(content.assetId);
            
            // Query balance and convert from raw balance to human-readable format
            // Divide by 10^decimals to get the actual balance value
            const rawBalance = await assethubService.chain.getUserBalance(content.address, content.assetId);
            const balance = (Number(rawBalance) / (10 ** decimals)).toString();
            const targetAddress = content.address ?? await assethubService.chain.getMyAddress();
            const assetLabel = content.assetId == null ? "native DOT" : `asset ${content.assetId}`;
            const ownerLabel = content.address == null ? "Your" : content.address;
            const logOwnerLabel = content.address == null ? "your" : content.address;
            const response = {
                text: `${ownerLabel}'s ${assetLabel} Balance on the POLKADOT AssetHub is ${balance}`,
                content: {
                    balance: balance.toString(),
                    address: targetAddress,
                    assetId: content.assetId == null ? "DOT" : content.assetId,
                    decimals: decimals,
                },
            } satisfies Content;
            if (callback) {
                await callback(response);
            }
            runtime.logger.info(`Get ${logOwnerLabel} ${assetLabel} Balance on the POLKADOT AssetHub successfully, balance: ${balance.toString()}`);
            return {
                success: true,
                text: response.text,
                data: {
                    balance: balance.toString(),
                    address: targetAddress,
                    assetId: content.assetId,
                    decimals,
                },
            } satisfies ActionResult;

        } catch (e) {
            const errorText = `Failed to get user's or your own DOT or assets balance on the POLKADOT AssetHub. error: ${e}`;
            runtime.logger.error(errorText);
            if (callback) {
                await callback({
                    text: errorText,
                    content: {error: errorText},
                });
            }
            return {
                success: false,
                text: errorText,
                error: e instanceof Error ? e : String(e),
            } satisfies ActionResult;

        }
    },
    /** Example prompts for this action (currently empty, can be populated with example queries) */
    examples: [
            [{
                name: '{{name1}}',
                content: {
                    text: "Get my DOT balance",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Getting my DOT balance now...",
                    actions: ["USER_ASSETS_BALANCE"],
                },
            }],
            [{
                name: '{{name1}}',
                content: {
                    text: "Get my USDT balance",
                },
            },
            {
                name: '{{name2}}',
                content: {
                    text: "Getting my USDT balance now...",
                    actions: ["USER_ASSETS_BALANCE"],
                },
            }],
            [
                {
                    name: "{{name1}}",
                    content: {
                        text: "Get '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe's DOT balance",
                    },
                },
                {
                    name: "{{name2}}",
                    content: {
                        text: "Getting '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe's DOT balance now...",
                        actions: ["USER_ASSETS_BALANCE"],
                    },

                },

            ],
            [
                {name: "{{name1}}",
                    content: {
                        text: "Get '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe's Asset 1984 balance",
                    },
                },
                {
                    name: "{{name2}}",
                    content: {
                        text: "Getting '14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe's Asset 1984 balance now...",
                        actions: ["USER_ASSETS_BALANCE"],
                    },
                },
            ],
        ] as ActionExample[][],
} as Action;