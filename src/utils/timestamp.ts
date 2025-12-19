export const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Unix 时间戳是秒，需要乘以 1000 转换为毫秒
    return date.toLocaleString(); // 转换为本地时间字符串
};