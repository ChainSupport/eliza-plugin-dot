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
import { z } from 'zod';


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
