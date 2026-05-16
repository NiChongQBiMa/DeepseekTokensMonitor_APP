import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const STORAGE_KEY = '@deepseek_api_key';
const BASE_URL = 'https://api.deepseek.com';

let apiKey = null;

export async function initApiKey() {
  try {
    apiKey = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (e) {
    apiKey = null;
  }
  return apiKey;
}

export async function setApiKey(key) {
  apiKey = key;
  await AsyncStorage.setItem(STORAGE_KEY, key);
}

export function getApiKey() {
  return apiKey;
}

/**
 * Fetch usage statistics from DeepSeek API.
 * DeepSeek provides billing/usage info via the /user/balance endpoint.
 */
export async function fetchUsageStats() {
  if (!apiKey) {
    throw new Error('API Key 未设置，请前往设置页面配置');
  }

  const response = await axios.get(`${BASE_URL}/user/balance`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return parseUsageResponse(response.data);
}

/**
 * Parse the DeepSeek API response into a unified format.
 * The /user/balance endpoint returns:
 * {
 *   "is_available": true,
 *   "balance_infos": [
 *     { "currency": "CNY", "total_balance": "100.00", "topped_up_balance": "50.00", "granted_balance": "50.00" },
 *     { "currency": "USD", "total_balance": "...", ... }
 *   ]
 * }
 *
 * Also supports the /v1/usage endpoint for token-level detail.
 */
function parseUsageResponse(data) {
  // Handle /user/balance response
  if (data.balance_infos) {
    const cnyInfo = data.balance_infos.find(b => b.currency === 'CNY')
      || data.balance_infos[0];

    return {
      isAvailable: data.is_available ?? true,
      totalBalance: parseFloat(cnyInfo?.total_balance || '0'),
      toppedUpBalance: parseFloat(cnyInfo?.topped_up_balance || '0'),
      grantedBalance: parseFloat(cnyInfo?.granted_balance || '0'),
      currency: cnyInfo?.currency || 'CNY',
      // Estimated token usage (DeepSeek pricing: ~¥1 per 1M tokens roughly)
      estimatedTokensUsed: estimateTokensFromBalance(
        parseFloat(cnyInfo?.topped_up_balance || '0'),
        parseFloat(cnyInfo?.granted_balance || '0')
      ),
      raw: data,
    };
  }

  // Handle /v1/usage response (token-level detail)
  if (data.total_tokens !== undefined) {
    return {
      isAvailable: true,
      totalTokens: data.total_tokens || 0,
      promptTokens: data.prompt_tokens || 0,
      completionTokens: data.completion_tokens || 0,
      totalCost: data.total_cost || 0,
      currency: 'CNY',
      raw: data,
    };
  }

  // Fallback: treat as raw usage data
  return {
    isAvailable: true,
    totalBalance: data.total_balance || 0,
    totalTokens: data.total_tokens || data.usage?.total_tokens || 0,
    totalCost: data.total_cost || 0,
    currency: 'CNY',
    raw: data,
  };
}

function estimateTokensFromBalance(toppedUp, granted) {
  // Rough estimate: 1M tokens ≈ ¥1 (varies by model)
  // This is a fallback when only balance data is available
  return Math.round(((toppedUp + granted) || 0) * 1000000);
}

/**
 * Fetch detailed token usage for a specific date range.
 */
export async function fetchTokenUsage(startDate, endDate) {
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }

  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await axios.get(`${BASE_URL}/v1/usage`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    params,
    timeout: 15000,
  });

  return parseUsageResponse(response.data);
}
