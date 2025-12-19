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
 * Action for querying transfer details by transaction hash on Polkadot Asset Hub.
 * Fetches transfer transaction details including sender, recipient, amounts, and decrypts encrypted memos.
 * Input parameters: txHash (transaction hash)
 * Output: transfer details with decrypted memo
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
import { z } from 'zod';
import {AssetHubService} from '../assethub-service';
import { TransferDetailWithMemo } from '../types';


interface GetTransferDetailByHashContent extends Content {
    txHash: string;
}

const GetTransferDetailByHashContentSchema = z.object({
    txHash: z.string(),
}).strict();

function validateGetTransferDetailByHashContent(runtime: IAgentRuntime, content: GetTransferDetailByHashContent): [boolean, GetTransferDetailByHashContent | null] {
    const result = GetTransferDetailByHashContentSchema.safeParse(content);
    if (!result.success) {
        runtime.logger.warn(`validateGetTransferDetailByHashContent: ${result.error.message}`);
        return [false, null];
    }
    content = result.data as GetTransferDetailByHashContent;
    return [true, content];
}

const getTransferDetailByHashPrompt = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Example responses:
    \`\`\`json
    {
        "txHash": "0x5ec0784fe5475f7d4a4cd70a4acce0f498376728a770cf534e349db83127e197",
    }
    \`\`\`

    {{recentMessages}}

    Extract the following information about the requested transfer by hash:
    - Tx Hash, The hash of the transfer, type must be string, not null
    `;

/**
 * Action definition for retrieving transfer details by transaction hash on Polkadot Asset Hub.
 * This action fetches transfer transaction details for a given transaction hash,
 * decrypts any encrypted memos, and returns the complete transaction information.
 */
export const GET_TRANSFER_DETAIL_BY_HASH: Action = {
    name: "GET_TRANSFER_DETAIL_BY_HASH",
    similes: [
        "GET_TRANSFER_DETAIL_BY_HASH",
        "GET_TRANSFER_BY_HASH",
        "GET_TRANSACTION_BY_HASH",
        "GET_TRANSACTION_DETAIL_BY_HASH",
        "QUERY_TRANSFER_BY_HASH",
        "QUERY_TRANSACTION_BY_HASH",
        "GET_TX_DETAIL_BY_HASH",
        "GET_TX_BY_HASH",
        "FIND_TRANSFER_BY_HASH",
        "FIND_TRANSACTION_BY_HASH",
        "GET_MEMO_BY_HASH",
        "GET_MESSAGE_BY_HASH",
    ],
    description: "Get transfer details by transaction hash on the POLKADOT AssetHub, including decrypted memos",
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
     * Handler function that retrieves transfer details by transaction hash.
     * Extracts transaction hash from user input, fetches transfer details from Subscan API,
     * decrypts encrypted memos, and formats the results for display.
     * 
     * @param runtime - The agent runtime instance
     * @param message - The message memory
     * @param state - The current state
     * @param _options - Optional parameters (unused)
     * @param callback - Optional callback function for returning results or errors
     * @returns true if the transfer details are retrieved successfully, false otherwise
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
        try {
            runtime.logger.info("start to get transfer detail by hash on the POLKADOT AssetHub");
            
            // Compose prompt from state and template
            const transferDetailPrompt = composePromptFromState({
                state: state,
                template: getTransferDetailByHashPrompt,
            });

            // Use LLM to extract transaction hash from user input
            const result = await runtime.useModel(ModelType.TEXT_LARGE, {
                prompt: transferDetailPrompt,
            });

            // Parse the JSON response from LLM
            const c = parseJSONObjectFromText(result) as GetTransferDetailByHashContent;
            const content = validateGetTransferDetailByHashContent(runtime, c)[1];
            if (content == null) {
                const errorText = `Invalid txHash: ${c.txHash}`;
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

            runtime.logger.info(`validateGetTransferDetailByHashContent: ${JSON.stringify(content)}`);
            
            // Get the AssetHubService instance
            const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
            if (!assethubService.subscanApi || !assethubService.chain.cryptMessage) {
                throw new Error("Subscan API or cryptMessage is not initialized");
            }
            
            // Get transfer details by hash
            const transfer: TransferDetailWithMemo = await assethubService.subscanApi.getTransferByHash(content.txHash);
            
            if (!transfer) {
                const errorText = `Transfer not found for hash: ${content.txHash}`;
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
            
            // Decrypt memo if present
            const transfersWithDecryptedMemo: TransferDetailWithMemo[] = await assethubService.subscanApi.decryptTransfersMemo(
                [transfer],
                assethubService.chain.cryptMessage
            );
            const transferDetail = transfersWithDecryptedMemo[0];
            
            // Format transfer detail as readable text
            const detailText = `Type: ${transferDetail.type} \nSender: ${transferDetail.sender} \nRecipient: ${transferDetail.recipient} \nToken: ${transferDetail.tokenSymbol} \nAmount: ${transferDetail.amount} \nFee: ${transferDetail.fee} \nMemo: ${transferDetail.memo} \nTimestamp: ${transferDetail.timestamp} \nTxId: ${transferDetail.txId}`;
            
            const response = {
                text: `Get transfer detail by hash on the POLKADOT AssetHub successfully. \nDetail: \n ${detailText}`,
                content: {transferDetail},
            } satisfies Content;
            if (callback) {
                await callback(response);
            }
            runtime.logger.info(`Get transfer detail by hash on the POLKADOT AssetHub successfully, detail: \n ${detailText}`);
            return {
                success: true,
                text: response.text,
                data: {
                    txHash: content.txHash,
                    transferDetail,
                },
            } satisfies ActionResult;
        } catch(e) {
            // Handle errors and notify via callback if available
            const errorText = `Failed to get transfer detail by hash on the POLKADOT AssetHub. error: ${e}`;
            if (callback) {
                await callback({
                    text: errorText,
                    content: {error: errorText},
                });
            }
            runtime.logger.error(errorText);
            return {
                success: false,
                text: errorText,
                error: e instanceof Error ? e : String(e),
            } satisfies ActionResult;
        }
    },
    /** Example prompts for this action */
    examples: [
        [
            {name: "{{name1}}",
                content: {
                    text: "Get transfer detail by hash 0x5ec0784fe5475f7d4a4cd70a4acce0f498376728a770cf534e349db83127e197",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting transfer detail by hash now...",
                    actions: ["GET_TRANSFER_DETAIL_BY_HASH"],
                },
            },
        ],
    
        [
            {name: "{{name1}}",
                content: {
                    text: "Get memo by transaction hash 0xa09de785bc38e5650553383067b8cb910c021645e50058b1077073ac9166e3d2",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Getting memo by transaction hash now...",
                    actions: ["GET_TRANSFER_DETAIL_BY_HASH"],
                },
            },
        ],
        [
            {name: "{{name1}}",
                content: {
                    text: "Find transaction 0xa09de785bc38e5650553383067b8cb910c021645e50058b1077073ac9166e3d2",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Finding transaction now...",
                    actions: ["GET_TRANSFER_DETAIL_BY_HASH"],
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
