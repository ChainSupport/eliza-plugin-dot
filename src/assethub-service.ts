
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

import { type IAgentRuntime, Service, logger } from '@elizaos/core';
import { checkAddress} from "@polkadot/util-crypto";
import { SubstrateChain } from './common/substrate-chain';
import {DEFAULT_ASSET_HUB_RPC_URL, DEFAULT_SUBSCAN_X_API_KEY} from "./constants"
import {SR25519AES} from "@eliza-dot-aes/sr25519-aes"
import {SubscanApi} from "./common/subscan-api";


/**
 * Service class for interacting with the Polkadot Asset Hub blockchain.
 * Provides blockchain operations including wallet management, balance queries,
 * asset transfers, and encrypted message sending via the SubstrateChain client.
 * Integrates with Subscan API for transaction history and memo retrieval.
 */
export class AssetHubService extends Service {
  static serviceType: string = "Polkadot Asset Hub";  
  public readonly capabilityDescription = `The agent is able to interact with the Polkadot Asset Hub blockchain, and has access to the wallet data`
  
  /** SubstrateChain client instance for blockchain interactions */
  public chain: SubstrateChain;
  
  /** SubscanApi instance for querying transaction history and memos */
  public subscanApi: SubscanApi;

  /**
   * Creates a new AssetHubService instance.
   * Note: The service must be started via the start() method before use.
   * 
   * @param runtime - The agent runtime instance for accessing settings and services
   */
  constructor(runtime: IAgentRuntime) {
    super();
  }


  /**
   * Stops the service and cleans up resources.
   * Releases the SubstrateChain and SubscanApi instances.
   * Should be called when the service is no longer needed.
   * 
   * @returns Promise that resolves when the service has been stopped
   */
  async stop(): Promise<void> {
    this.chain = null;
    this.subscanApi = null;
  }

  /**
   * Starts the service and initializes required components.
   * Initializes SubscanApi and SubstrateChain instances with configuration from runtime settings.
   * The service requires ASSET_HUB_PRIVATE_KEY to be set in runtime settings.
   * 
   * Configuration options:
   * - ASSET_HUB_RPC_URL: RPC endpoint URL (defaults to DEFAULT_ASSET_HUB_RPC_URL)
   * - SUBSCAN_X_API_KEY: Subscan API key (defaults to DEFAULT_SUBSCAN_X_API_KEY)
   * - ASSET_HUB_PRIVATE_KEY: Private key for wallet operations (required)
   * 
   * @param runtime - The agent runtime instance for accessing settings
   * @returns Promise that resolves when the service has been started
   * @throws Error if ASSET_HUB_PRIVATE_KEY is not set or chain initialization fails
   */
  async start(runtime: IAgentRuntime): Promise<void> {
    try {
      if (this.subscanApi == null) {
        this.subscanApi = new SubscanApi("assethub-polkadot", runtime.getSetting("SUBSCAN_X_API_KEY") || DEFAULT_SUBSCAN_X_API_KEY);
        logger.info("subscanApi initialized");
      }
      if (this.chain == null) {
        const rpcUrl = runtime.getSetting("ASSET_HUB_RPC_URL") || DEFAULT_ASSET_HUB_RPC_URL;
        logger.info(`ASSET_HUB_RPC_URL: ${rpcUrl}`);
        const privateKey = runtime.getSetting("ASSET_HUB_PRIVATE_KEY");
        if (privateKey == null) {
          throw new Error("ASSET_HUB_PRIVATE_KEY is required");
        }
        this.chain = await SubstrateChain.create(rpcUrl, privateKey, "sr25519", this.subscanApi, await SR25519AES.build(privateKey));
        if (this.chain.chainName != AssetHubService.serviceType) {
          throw new Error(`chain name is not ${AssetHubService.serviceType}`);
        }
        logger.info(`chain initialized, and my wallet address: ${await this.chain.getMyAddress()}`);
      }
      logger.info("Polkadot Asset Hub service started");
    } catch (e) {
      logger.error(`Failed to start Polkadot Asset Hub service: ${e}`);
    }
    
  }

  /**
   * Static method to stop the AssetHubService instance registered in the runtime.
   * Retrieves the service from the runtime and calls its stop() method to clean up resources.
   * 
   * @param runtime - The agent runtime instance containing the registered service
   * @returns Promise that resolves when the service has been stopped, or immediately if service not found
   */
  static async stop(runtime: IAgentRuntime) {

    const client = runtime.getService(AssetHubService.serviceType);
    if (!client) {
      logger.error("assethub-polkadot service not found");
      return;
    }
    await client.stop();

  }
}