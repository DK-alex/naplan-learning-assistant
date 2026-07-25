# NAPLAN Learning Assistant

一款面向 Windows 的本地 NAPLAN 学习与模拟练习软件，支持 Year 3、5、7、9，包含分年级题库、写作练习、学习记录、错题本和可选的 AI 作文批改。

> 本项目是独立开发的非官方学习工具，与 ACARA、NAP、澳大利亚政府或任何学校无隶属、认可或合作关系。

## 下载最新版

当前版本：**v1.0.18**

- [Windows 安装版（推荐）](https://github.com/DK-alex/naplan-learning-assistant/releases/download/v1.0.18/NAPLAN-Learning-Assistant-Setup-1.0.18-x64.exe)
- [Windows 免安装版](https://github.com/DK-alex/naplan-learning-assistant/releases/download/v1.0.18/NAPLAN-Learning-Assistant-Portable-1.0.18-x64.exe)
- [所有版本与 SHA-256 校验值](https://github.com/DK-alex/naplan-learning-assistant/releases)

系统要求：Windows 10/11，x64。

安装版下载后运行安装程序；免安装版下载后可直接双击运行。软件和学习记录保存在本机，不需要把题库部署到服务器。

### Windows 安全提示

当前安装包尚未使用商业代码签名证书。Windows SmartScreen 可能在首次运行时显示“Windows 已保护你的电脑”。请只从本仓库的 Releases 页面下载，并对照 Release 中的 SHA-256 校验值确认文件完整性。

## 主要功能

- Year 3、5、7、9 分年级练习题库
- 选择、填空、排序、拖拽、连线、测量等多种答题形式
- 图片题与写作刺激材料
- 模拟考试、自动保存、考试结束后统一回顾
- 错题自动加入错题本
- 学习目标、领域进度和学习记录
- 本地保存的作文批改历史
- 作文报告导出为 Word，支持用户语言版和英文版
- 可选 OpenAI、Google Gemini、Qwen、DeepSeek 作文批改
- NAPLAN 官方资讯、网页、在线视频及 PDF 阅读入口

AI 服务的 API Key 由用户在软件内自行配置，仅保存在当前软件会话中，不会提交到本仓库。

## 从源码运行

需要 Node.js 20 或更高版本。

```powershell
npm install
npm run desktop:dev
```

运行测试：

```powershell
npm run test:sites
```

构建 Windows 安装版和免安装版：

```powershell
npm run desktop:package
```

生成文件位于 `release/`。

## 题库说明

题库和写作题为独立编写内容，用于练习相似的能力与题型，不复制真实 NAPLAN 试题。难度、题型和年级范围参考公开的 NAPLAN 评估框架与官方示例材料。

## 许可证与第三方材料

项目代码以 [MIT License](LICENSE) 开源。NAPLAN、ACARA、NAP 及其他第三方名称、标志、网页摘录和官方材料仍归各自权利人所有，不包含在 MIT 授权范围内。详见 [NOTICE.md](NOTICE.md)。

## 隐私

这是本地优先的单机软件。学习记录、错题、设置与批改历史默认保存在本机。使用第三方 AI 批改功能时，用户提交的作文内容会发送到用户选择的 AI 服务商，请同时遵守对应服务商的隐私政策与使用条款。
