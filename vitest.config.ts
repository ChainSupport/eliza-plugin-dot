import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_ASSET_HUB_RPC_URL, DEFAULT_SUBSCAN_X_API_KEY } from './src/constants';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Load environment variables from vitest.env file
config({ path: resolve(__dirname, 'vitest.env') });

export default defineConfig({
    test: {
        env: {
            ASSETHUB_RPC_URL: process.env.ASSETHUB_RPC_URL || DEFAULT_ASSET_HUB_RPC_URL,
            ALICE_PRIVATE_KEY: process.env.ALICE_PRIVATE_KEY || '',
            BOB_PRIVATE_KEY: process.env.BOB_PRIVATE_KEY || '',
            SUBSCAN_API_KEY: process.env.SUBSCAN_API_KEY || DEFAULT_SUBSCAN_X_API_KEY,
        },
    },
});
