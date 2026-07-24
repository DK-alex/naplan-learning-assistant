# NAPLAN 模拟题库

本目录包含 Year 3、5、7、9 四个年级的原创 NAPLAN 风格练习题，共 8,240 道。题库依据 ACARA/NAP 官方公开资料中的考试范围、题型、时长、内容比例与写作评分维度设计，但不是官方试题，也不代表 ACARA/NAP 的认可或预测。

当前版本为 `2026.2`。这一版不再把同一套 easy/medium/hard 标签随机复制到四个年级，而是同时保存年级内难度、1–9 的跨年级设计复杂度、testlet 候选节点和未校准状态。

## 文件

- `questions/year-3.jsonl`：Year 3，2,060 道
- `questions/year-5.jsonl`：Year 5，2,060 道
- `questions/year-7.jsonl`：Year 7，2,060 道
- `questions/year-9.jsonl`：Year 9，2,060 道
- `manifest.json`：版本、来源、各年级数量及分布
- `blueprint.md`：出题范围、考试结构和题库配额
- `writing-rubric-ai.md`：可直接作为作文批改 AI 的 system/developer prompt
- `question-schema.json`：单题 JSON Schema
- `reports/validation.md`：自动校验结果
- `scripts/generate-bank.mjs`：可重复生成题库
- `scripts/validate-bank.mjs`：完整性与重复项校验

每行 JSON 是一道独立题目，适合流式读取、随机抽题和分批导入数据库。文件编码为 UTF-8。

## 每年级配额

| 领域 | 数量 |
|---|---:|
| Reading | 560 |
| Conventions of language | 600 |
| Numeracy | 800 |
| Writing prompts | 100 |
| 合计 | 2,060 |

## 年级难度

| 年级 | Easy | Medium | Hard | Writing N/A | 跨年级复杂度 |
|---|---:|---:|---:|---:|---|
| Year 3 | 772 | 870 | 318 | 100 | 1 / 2 / 3 |
| Year 5 | 608 | 884 | 468 | 100 | 3 / 4 / 5 |
| Year 7 | 458 | 884 | 618 | 100 | 5 / 6 / 7 |
| Year 9 | 388 | 790 | 782 | 100 | 7 / 8 / 9 |

`difficulty` 是题目在本年级内部的设计带，`difficulty_model.absolute_complexity` 用于区分不同年级的绝对内容复杂度。相邻年级允许重叠，但 Year 3 hard 不等同于 Year 9 hard。Writing 是共同写作任务，不再标 easy/medium/hard。

阅读文章的年级平均长度目标分别为 Year 3 `65–90`、Year 5 `110–150`、Year 7 `145–190`、Year 9 `170–220` 词；难度还同时由句法、信息显隐、推理步数、干扰项接近程度和证据整合要求控制，不能只按篇幅判断。

所有客观题难度目前仍是设计估计，`psychometric` 固定标为 `uncalibrated`。完成学生试测、Rasch、item fit 和 DIF 分析前，不得生成官方 scaled score 或 proficiency level。

## 真实交互与视觉

题库使用 `multiple_choice`、`multiple_select`、`hot_text`、`inline_choice`、`drag_and_drop`、`matrix`、`hotspot`、`text_entry` 和 `writing_prompt`。

`drag_and_drop` 是三步排序题，保存多个目标和完整 placement map；`multiple_select` 保存多个正确 option id；`matrix` 保存逐行 response map；`hot_text` 以可点击文本片段作答。它们不再只是改名后的单选题。

答案关键型图形使用 `stimulus.visual` 保存可重复生成的 SVG 参数。图片、表格、音频和数学工具统一进入 `media`、`tool_policy` 与 `accessibility` 字段。生成式图片只用于原创情境素材；精确角度、长度、坐标、图表和热点由 SVG/HTML 参数控制。

每个年级的 100 道 Writing 题按 Narrative 50、Persuasive 50 配置。完整题面保存在 `stimulus.context`、`stimulus.instructions`、`stimulus.idea_starters` 和 `stimulus.remember`；Year 3、5、7、9 分别使用从具体事件和基础理由到视角控制、反方论证、证据权衡与限定性结论的递进支架。每题的原创配图保存在 `public/assets/writing-prompts/year-{year}/`，并通过 `stimulus.image` 与题目一一绑定。

## 使用

```bash
npm run generate:bank
npm run validate:bank
```

建议模拟考试时按 `blueprint.md` 中的正式测试题量和时长抽取，而不是一次加载 2,000 道。Reading 的七道题共享同一 `stimulus.id`；组卷时必须将同一篇文章及对应题目放在同一 testlet。

Year 7 和 Year 9 的 Numeracy 题含 `calculator` 字段，可据此先组 non-calculator section，再组 calculator-allowed section。Year 3 和 Year 5 不允许使用计算器。

## 内容与版权说明

所有题干、文章、选项、答案、解析及写作题目均由本项目原创生成，`provenance.official_item` 固定为 `false`，`source_mode` 固定为 `public_spec_reference`。没有复制或改写 NAPLAN 公共演示站的正式示例题、图片、受限评分样卷或学生作答。

对 NAPLAN Assessment Framework 的概括按其 CC BY 4.0 许可使用并注明来源：

- National Assessment Program, *NAPLAN Assessment Framework*, updated December 2025, ACARA.
- <https://nap.edu.au/docs/default-source/naplan/naplan-assessment-framework.pdf>

其他官方参考：

- <https://www.nap.edu.au/naplan/whats-in-the-tests>
- <https://www.nap.edu.au/naplan/public-demonstration-site>
- <https://www.nap.edu.au/naplan/faqs/naplan--writing-test>
- <https://nap.edu.au/naplan/results-and-reports/proficiency-level-descriptions>
- <https://www.nap.edu.au/resources>
