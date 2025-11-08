
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
 * Action for sending encrypted messages on Polkadot Asset Hub.
 * Sends encrypted messages to other users via zero-amount transfers with encrypted memos.
 * Input parameters: recipient address and message content
 * Output: transaction hash upon successful message send
 */

import { checkAddress} from "@polkadot/util-crypto";
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

/**
 * Content interface for sending encrypted messages.
 * Extends the base Content interface with recipient and message fields.
 */
interface SendMessageContent extends Content {
    /** The recipient wallet address. */
    recipient: string;
    /** The message content to encrypt and send. */
    message: string;
}

/**
 * Validates the send message content.
 * Checks if recipient is a valid address and message is not null.
 * 
 * @param content - The SendMessageContent object to validate
 * @returns true if the content is valid, false otherwise
 */
function validateSendMessageContent(runtime: IAgentRuntime, content: SendMessageContent): boolean {
    if (content.recipient === null || content.recipient === "" || !checkAddress(content.recipient, 0)[0]) {
        runtime.logger.warn(`recipient ${content.recipient} is not a valid address`);
        return false;
    }
    if (content.message === null || content.message === "") {
        runtime.logger.warn(`message ${content.message} is not a valid message`);
        return false;
    }
    return true;
}

/**
 * Template string for prompting the LLM to extract recipient and message information.
 * Provides example for sending encrypted messages.
 */
const sendMessageTemplate = `
    Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Example responses:
    \`\`\`json
    {
        "recipient": "14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
        "message": "Hello, how are you?"
    }
    \`\`\`
    {{recentMessages}}
    Extract the following information about the requested message:
    - Recipient wallet address
    - Message to send
    `;

/**
 * Action definition for sending encrypted messages on Polkadot Asset Hub.
 * This action allows users to send encrypted messages to other users via zero-amount
 * transfers with encrypted memos. The message is encrypted using the recipient's public key.
 */
export const SEND_MESSAGE: Action = {
    name: "SEND_MESSAGE_WITH_NO_TRANSFER",
    similes: [
        "SEND_MESSAGE",
        "SEND_PRIVATE_MESSAGE",
        "SEND_ENCRYPTED_MESSAGE",
        "TELL_SOMEONE_SOMETHIG",
        "SAY_SOMETHING_TO_SOMEONE",
        "TELL_SOMETHING_TO_SOMEONE_NO_TRANSFER",
    ],
    description: "Send an encrypted message to other users on the POLKADOT AssetHub, or tell someone something private with encrypted message",
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
     * Handler function that processes the send message request.
     * Uses LLM to extract recipient and message from user input, then sends
     * an encrypted message via zero-amount transfer on the Polkadot Asset Hub blockchain.
     * 
     * @param runtime - The agent runtime instance
     * @param message - The message memory
     * @param state - The current state
     * @param _options - Optional parameters (unused)
     * @param callback - Optional callback function for returning results or errors
     * @returns true if the message is sent successfully, false otherwise
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: {[key: string]: unknown}, callback?: HandlerCallback) => {
    
        try {
        runtime.logger.info("start to send an encrypted message to other users on the POLKADOT AssetHub");
        
        // Compose prompt from state and template
        const sendMessagePrompt = composePromptFromState({
            state: state,
            template: sendMessageTemplate,
        });
        
        // Use LLM to extract recipient and message from user input
        const result = await runtime.useModel(ModelType.TEXT_LARGE, {
            prompt: sendMessagePrompt,
        });
        
        // Parse the JSON response from LLM
        const content = parseJSONObjectFromText(result) as SendMessageContent;
        
        // Validate the extracted content
        if (!validateSendMessageContent(runtime, content)) {
            const errorText = `Invalid recipient '${content.recipient}' or message '${content.message}'`;
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
        
        // Get the AssetHubService instance and send the encrypted message
        const assethubService: AssetHubService = runtime.getService(AssetHubService.serviceType);
        const txHash = await assethubService.chain.sendMessage(content.recipient, content.message);
        const response = {
            text: `Send message '${content.message}' to ${content.recipient} successfully. txHash is ${txHash}`,
            content: {txHash: txHash, recipient: content.recipient, message: content.message},
        } satisfies Content;
        if (callback) {
            await callback(response);
        }
        runtime.logger.info(`Send message '${content.message}' to ${content.recipient} successfully, txHash: ${txHash}`);
        return {
            success: true,
            text: response.text,
            data: {
                txHash,
                recipient: content.recipient,
                message: content.message,
            },
        } satisfies ActionResult;
        } catch (e) {
            // Handle errors and notify via callback if available
            const errorText = `Failed to send message`;
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
    /** Example prompts for this action (currently empty, can be populated with example message queries) */
    examples: [
        [
            {name: "{{name1}}",
                content: {
                    text: "Send a message to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe: Hello, how are you?",
                },
            },
            {name: "{{name2}}",
                content: {
                    text: "Sending 'Hello, how are you?' to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
                    actions: ["SEND_MESSAGE"],
                }
            }
        ],
        [
            {
                name: "{{name1}}",
                content: {
                    text: "say 'Hello, how are you?' to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
                },
            },
            {
                name: "{{name2}}",
                content: {
                    text: "Sending 'Hello, how are you?' to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
                    actions: ["SEND_MESSAGE"],
                }
            }
        ],
        [
            {
                name: "{{name1}}",
                content: {
                    text: "Encrypt and send 'Hello, how are you?' to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe",
                },
            },
            {
                name: "{{name2}}",
                content: {
                    text: "Encrypting and sending 'Hello, how are you?' to 14NL8ves2Ue59ZNy73GQT4bhFFNJm3M4eA6yoGvjgAPQMvXe now...",
                    actions: ["SEND_MESSAGE"],
                }
            }
        ]
    ] as ActionExample[][]
} as Action;