import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 设置全局测试超时时间（毫秒）
        timeout: 30000, // 30 秒
        
        // 钩子函数的超时时间（beforeEach, afterEach 等）
        hookTimeout: 10000, // 10 秒
        
        // 清理函数的超时时间
        teardownTimeout: 10000, // 10 秒
    },
} as any);
