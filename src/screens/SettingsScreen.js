import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setApiKey, getApiKey, fetchUsageStats } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentKey, setCurrentKey] = useState('');

  useEffect(() => {
    const key = getApiKey();
    if (key) {
      setCurrentKey(key);
      setKeyInput(key);
      setSaved(true);
    }
  }, []);

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      Alert.alert('错误', '请输入有效的 API Key');
      return;
    }

    await setApiKey(trimmed);
    setCurrentKey(trimmed);
    setSaved(true);
    Alert.alert('成功', 'API Key 已保存');
  };

  const handleTest = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      Alert.alert('错误', '请先输入 API Key');
      return;
    }

    // Save first
    await setApiKey(trimmed);
    setCurrentKey(trimmed);
    setSaved(true);

    setTesting(true);
    try {
      const data = await fetchUsageStats();
      Alert.alert(
        '连接成功 ✅',
        `当前余额: ¥${(data.totalBalance || 0).toFixed(2)}\n账户状态: ${data.isAvailable ? '正常' : '异常'}`
      );
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'API Key 无效，请检查后重试'
        : err.message || '连接失败';
      Alert.alert('连接失败 ❌', msg);
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    await setApiKey('');
    setKeyInput('');
    setCurrentKey('');
    setSaved(false);
    Alert.alert('已清除', 'API Key 已移除');
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Info Section */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔑</Text>
            <Text style={styles.infoTitle}>DeepSeek API Key</Text>
            <Text style={styles.infoText}>
              请输入您的 DeepSeek API Key 以查看账户余额和使用量。{'\n'}
              API Key 存储在设备本地，不会上传到任何第三方服务器。
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.input}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!saved}
            />
            {saved && currentKey && (
              <Text style={styles.currentKey}>
                当前: {maskKey(currentKey)}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>💾 保存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTest}
              disabled={testing}
            >
              <Text style={styles.buttonText}>
                {testing ? '⏳ 测试中...' : '🔍 测试连接'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>🗑️ 清除 API Key</Text>
          </TouchableOpacity>

          {/* How to get API Key */}
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>如何获取 API Key？</Text>
            <Text style={styles.helpText}>
              1. 访问 platform.deepseek.com{'\n'}
              2. 登录您的 DeepSeek 账户{'\n'}
              3. 前往 "API Keys" 页面{'\n'}
              4. 创建新的 API Key 并复制{'\n'}
              5. 粘贴到上方输入框中
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  infoTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  currentKey: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  testButton: {
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    marginBottom: 24,
  },
  clearButtonText: {
    color: '#fca5a5',
    fontWeight: '500',
    fontSize: 14,
  },
  helpCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  helpTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 24,
  },
});
