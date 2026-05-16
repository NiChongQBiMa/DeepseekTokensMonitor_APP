import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import UsageCard from '../components/UsageCard';
import BalanceRing from '../components/BalanceRing';
import { fetchUsageStats, initApiKey, getApiKey } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const key = await initApiKey();
    setHasKey(!!key);
    if (key) {
      loadData();
    } else {
      setLoading(false);
      setError('请先设置 API Key');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchUsageStats();
      setUsageData(data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('API Key 无效，请重新设置');
        setHasKey(false);
      } else if (err.response?.status === 429) {
        setError('请求过于频繁，请稍后再试');
      } else {
        setError(err.message || '获取数据失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!hasKey) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [hasKey, loadData]);

  const formatCurrency = (value, currency = 'CNY') => {
    const symbol = currency === 'CNY' ? '¥' : '$';
    return `${symbol}${(value || 0).toFixed(2)}`;
  };

  const formatTokens = (tokens) => {
    if (!tokens || tokens === 0) return '0';
    if (tokens >= 1000000000) return `${(tokens / 1000000000).toFixed(2)}B`;
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // Calculate usage percentage
  const calculateUsagePercent = () => {
    if (!usageData) return 0;
    const total = usageData.totalBalance || 0;
    const granted = usageData.grantedBalance || 0;
    const toppedUp = usageData.toppedUpBalance || 0;
    const totalEver = toppedUp + granted;
    if (totalEver <= 0) return 0;
    return Math.min(((totalEver - total) / totalEver) * 100, 100);
  };

  if (loading && !usageData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#1e1b4b', '#0f172a']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>DeepSeek</Text>
          <Text style={styles.headerSubtitle}>用量与余额追踪</Text>

          {usageData && (
            <View style={styles.headerStats}>
              <Text style={styles.headerBalance}>
                {formatCurrency(usageData.totalBalance, usageData.currency)}
              </Text>
              <Text style={styles.headerBalanceLabel}>当前余额</Text>
            </View>
          )}
        </LinearGradient>

        {/* Error / No Key State */}
        {(error || !hasKey) && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error || '请先设置 API Key'}</Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.setupButtonText}>设置 API Key</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Balance Ring Chart */}
        {usageData && (
          <View style={styles.ringSection}>
            <BalanceRing
              percentage={calculateUsagePercent()}
              size={180}
              strokeWidth={12}
              color="#6366f1"
              label="已使用"
            />
            <View style={styles.ringLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.legendLabel}>充值余额</Text>
                <Text style={styles.legendValue}>
                  {formatCurrency(usageData.toppedUpBalance, usageData.currency)}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22d3ee' }]} />
                <Text style={styles.legendLabel}>赠送余额</Text>
                <Text style={styles.legendValue}>
                  {formatCurrency(usageData.grantedBalance, usageData.currency)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Usage Cards */}
        {usageData && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>用量概览</Text>

            <View style={styles.cardRow}>
              <UsageCard
                title="Tokens 使用量"
                value={formatTokens(
                  usageData.totalTokens || usageData.estimatedTokensUsed
                )}
                subtitle="实时累计"
                icon="📊"
                color="#6366f1"
                style={styles.halfCard}
              />
              <UsageCard
                title="余额消耗"
                value={formatCurrency(
                  (usageData.toppedUpBalance || 0) +
                    (usageData.grantedBalance || 0) -
                    (usageData.totalBalance || 0),
                  usageData.currency
                )}
                subtitle="历史总计"
                icon="💰"
                color="#f59e0b"
                style={styles.halfCard}
              />
            </View>

            <UsageCard
              title="剩余余额"
              value={formatCurrency(usageData.totalBalance, usageData.currency)}
              subtitle={usageData.isAvailable ? '账户正常' : '账户异常'}
              icon="🏦"
              color="#10b981"
            />

            {/* Token detail if available */}
            {usageData.promptTokens !== undefined && (
              <View style={styles.tokenDetail}>
                <Text style={styles.sectionTitle}>Token 详情</Text>
                <View style={styles.tokenRow}>
                  <View style={styles.tokenItem}>
                    <Text style={styles.tokenLabel}>Prompt Tokens</Text>
                    <Text style={styles.tokenValue}>
                      {formatTokens(usageData.promptTokens)}
                    </Text>
                  </View>
                  <View style={styles.tokenDivider} />
                  <View style={styles.tokenItem}>
                    <Text style={styles.tokenLabel}>Completion Tokens</Text>
                    <Text style={styles.tokenValue}>
                      {formatTokens(usageData.completionTokens)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️ API 设置</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  headerStats: {
    marginTop: 24,
    alignItems: 'center',
  },
  headerBalance: {
    fontSize: 42,
    fontWeight: '700',
    color: '#6366f1',
  },
  headerBalanceLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  errorCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ringLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  legendLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  legendValue: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cardsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
  },
  tokenDetail: {
    marginTop: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tokenItem: {
    flex: 1,
    alignItems: 'center',
  },
  tokenDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  tokenLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  tokenValue: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
});
