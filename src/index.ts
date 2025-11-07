
import type { Plugin } from '@elizaos/core';
import { USER_ASSETS_BALANCE } from './actions/address-assets-balance';
import { MY_WALLET_HISTORY } from './actions/my-wallet-history';
import { TRANSFER_ASSETS } from './actions/assets-transfer';
import { SEND_MESSAGE } from './actions/send-message';
import { AssetHubService } from './assethub-service';
import {GET_MY_WALLET_INFO} from "./actions/get-my-wallet-info"


export const polkadotAssetHubPlugin: Plugin = {
  name: "POLKADOT_ASSET_HUB",
  description: 'Polkadot Asset Hub integration plugin',
  providers: [],
  evaluators: [],
  services: [AssetHubService],
  actions: [USER_ASSETS_BALANCE, MY_WALLET_HISTORY, TRANSFER_ASSETS, SEND_MESSAGE, GET_MY_WALLET_INFO],
};

export default polkadotAssetHubPlugin;
