// /**
//  * Copyright (c) 2025 weimeme
//  * 
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  * 
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  * 
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

// import {
//     type IAgentRuntime,
//     type Memory,
//     type Provider,
//     // type ProviderResult,
//     type State,
//     elizaLogger,
//     TEEMode,
//     ServiceType,
//   } from '@elizaos/core';
// import NodeCache from 'node-cache';
// import { ApiPromise, Keyring, HttpProvider } from "@polkadot/api";
// const { KeypairType, KeyringPair } = require('@polkadot/util-crypto/types');
// const {mnemonicGenerate} = require('@polkadot/util-crypto');


//   // export class WalletProvider {
//   //   private cache: NodeCache;
//   //   private cacheKey: string = "dot/wallet";
//   //   public runtime: IAgentRuntime;
//   //   public api: ApiPromise;
//   //   constructor(runtime: IAgentRuntime) {
//   //       this.runtime = runtime;
//   //       this.cache = new NodeCache();
//   //       this.api = new ApiPromise({
//   //           provider: new HttpProvider('https://rpc.polkadot.io')
//   //       });
//   //   }
//   // }

  
//   interface ProviderResult {
//     data?: any;
//     values?: Record<string, string>;
//     text?: string;
//   }

//   export const walletProvider: Provider = {
//     name: 'wallet',
//     description: 'Wallet provider',
//     dynamic: true,
    
//     get: async (runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> => {
//         return {
//             data: {
//                 address: "1234567890",
//                 balance: "1000",
//             },
//             values: {
//                 address: "1234567890",
//             },
//             text: "Wallet provider",
//         }
//     }
//   }