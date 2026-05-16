# DeepSeek 用量追踪 App

实时查看 DeepSeek API 的 Token 使用量、余额消耗和剩余余额的移动端应用。

## 功能

- 📊 **实时用量面板** — 查看 Token 使用量和余额消耗
- 💰 **余额追踪** — 显示充值余额、赠送余额和总余额
- 📈 **使用百分比** — 环形进度条直观展示使用比例
- 🔄 **自动刷新** — 每 30 秒自动更新数据
- 🔐 **本地存储** — API Key 安全存储在设备本地

## 技术栈

- React Native (Expo SDK 52)
- React Navigation
- Axios
- react-native-svg

## 快速开始

### 前置要求

- Node.js 18+
- Expo CLI
- iOS / Android 设备或模拟器

### 安装

```bash
npm install
```

### 运行

```bash
npx expo start
```

然后用 Expo Go App 扫描二维码，或在模拟器中运行：

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios
```

## 使用说明

1. 打开 App，进入「API 设置」页面
2. 输入你的 DeepSeek API Key（从 platform.deepseek.com 获取）
3. 点击「测试连接」验证 API Key 有效性
4. 返回主页，即可查看实时用量数据

## 项目结构

```
/
├── App.js                    # 应用入口
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js     # 主页 - 用量面板
│   │   └── SettingsScreen.js # API Key 设置页
│   ├── components/
│   │   ├── UsageCard.js      # 数据卡片组件
│   │   └── BalanceRing.js    # 环形进度组件
│   └── services/
│       └── api.js            # DeepSeek API 服务
├── package.json
└── app.json
```
