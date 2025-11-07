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


import type { Plugin } from '@elizaos/core';
import { USER_ASSETS_BALANCE } from './actions/address-assets-balance';
import { MY_WALLET_HISTORY } from './actions/my-wallet-history';
import { TRANSFER_ASSETS } from './actions/assets-transfer';
import { SEND_MESSAGE } from './actions/send-message';
import { AssetHubService } from './assethub-service';
import {GET_MY_WALLET_INFO} from "./actions/get-my-wallet-info";

export const polkadotAssetHubPlugin: Plugin = {
  name: "POLKADOT_ASSET_HUB",
  description: 'Polkadot Asset Hub integration plugin',
  providers: [],
  evaluators: [],
  services: [AssetHubService],
  actions: [USER_ASSETS_BALANCE, MY_WALLET_HISTORY, TRANSFER_ASSETS, SEND_MESSAGE, GET_MY_WALLET_INFO],

  init: async (_, runtime) => {
    console.log('Polkadot Asset Hub plugin initialized.');
  }
};

export default polkadotAssetHubPlugin;
