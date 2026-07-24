# NAPLAN 模拟题库出题蓝图

版本：2026.2  
适用年级：Year 3、5、7、9

## 1. 官方范围转化原则

1. Reading、Writing、Conventions of language 和 Numeracy 均对齐 Australian Curriculum: English / Mathematics。
2. 大部分内容来自考生前序年级已学内容；少量当前年级或后续年级内容，只在可通过推理、题内信息或文本证据解决时使用。
3. Reading、Numeracy、Grammar and punctuation 采用三阶段 testlet 路径的思路分为 lower、average、higher。本题库以 `pathway_band` 表示练习路径，不模拟或声称复现官方算法。
4. 所有内容为原创练习材料，不复制公共演示站题目。
5. easy / medium / hard 是本年级内部难度标签，不等同于 Exceeding、Strong、Developing、Needs additional support。
6. 每题同时保存 1–9 的跨年级 `absolute_complexity` 设计索引：Year 3 为 1–3、Year 5 为 3–5、Year 7 为 5–7、Year 9 为 7–9。相邻年级允许重叠，但不能把 Year 3 hard 当成 Year 9 hard。
7. 设计难度必须明确标为 `uncalibrated`；完成 Rasch、item fit 和 DIF 分析前，不输出 scaled score。

## 2. 正式测试结构参考

| 测试 | Year 3 | Year 5 | Year 7 | Year 9 |
|---|---:|---:|---:|---:|
| Reading | 39题 / 45分钟 | 39题 / 50分钟 | 48题 / 65分钟 | 48题 / 65分钟 |
| Conventions of language | 52题 / 45分钟 | 52题 / 45分钟 | 52题 / 45分钟 | 52题 / 45分钟 |
| Numeracy | 36题 / 45分钟 | 42题 / 50分钟 | 48题 / 65分钟 | 48题 / 65分钟 |
| Writing | 40分钟，纸笔 | 42分钟，在线 | 42分钟，在线 | 42分钟，在线 |

Year 7 和 Year 9 Numeracy 先完成较短的 non-calculator section，再进入 calculator-allowed section；Year 3 和 Year 5 不使用计算器。

## 3. 每年级题库配额

| 领域 | 数量 | 内部分配 |
|---|---:|---|
| Reading | 560 | 80 篇原创文本 × 每篇 7 题 |
| Conventions of language | 600 | Spelling 288；Grammar 218；Punctuation 94 |
| Numeracy | 800 | 按年级数学内容比例分配 |
| Writing | 100 | Narrative 50；Persuasive 50 |
| 合计 | 2,060 | 详见下方年级难度表 |

| 年级 | Easy | Medium | Hard | Writing N/A |
|---|---:|---:|---:|---:|
| Year 3 | 772 | 870 | 318 | 100 |
| Year 5 | 608 | 884 | 468 | 100 |
| Year 7 | 458 | 884 | 618 | 100 |
| Year 9 | 388 | 790 | 782 | 100 |

Writing 不设置 easy/medium/hard，但题面支架按年级递进：Year 3 使用具体情境、事件顺序和基础理由；Year 5 加入人物动机、反方关注点与实例；Year 7 强调视角、节奏、证据和反驳；Year 9 强调结构控制、价值冲突、限定性主张和多方影响。每道题必须包含完整情境、4 个构思提示、检查清单和一张只提供开放式线索的原创相关配图。

## 4. Reading

### 文本类型

Year 3 / 5：

| 类型 | 文章 | 题目 | 占 Reading |
|---|---:|---:|---:|
| Imaginative | 32 | 224 | 40% |
| Informative | 28 | 196 | 35% |
| Persuasive | 20 | 140 | 25% |

Year 7 / 9：

| 类型 | 文章 | 题目 | 占 Reading |
|---|---:|---:|---:|
| Imaginative | 26 | 182 | 32.5% |
| Informative | 27 | 189 | 33.75% |
| Persuasive | 27 | 189 | 33.75% |

每篇文章的七题按认知层次配置：

- locate：2 题，直接定位明确事实或信息；
- integrate / interpret：3 题，连接多处信息、推断、概括；
- analyse / evaluate：2 题，分析作者选择、证据、结构、语气或局限。

Year 3 / 5 的文本语言和篇幅较短，信息结构更显性；Year 7 / 9 增加观点冲突、限制条件、隐含意义、证据质量和结构分析。

## 5. Conventions of language

### Spelling

共 288 题：

| 形式 | 数量 | 比例 |
|---|---:|---:|
| Audio dictation script | 173 | 60.1% |
| Proofreading，错误位置已标出 | 58 | 20.1% |
| Proofreading，需自行找出错误 | 57 | 19.8% |

词汇按年级和难度分层；使用 Standard Australian English 拼写。`audio_dictation_script` 同时提供界面显示文本和可送入 TTS 的 `audio_script`。

### Grammar and punctuation

- Grammar 218 题，覆盖词类、主谓一致、时态、代词、连接词、从句、语态、完整句、修饰语和并列结构。
- Punctuation 94 题，覆盖大写与句末标点、问号、列表逗号、所有格撇号、直接引语、从句逗号、冒号和分号。
- 年级越高，越强调复杂句、语篇衔接、语法选择对意义与语气的影响。

## 6. Numeracy

| Strand | Year 3 | Year 5 | Year 7 | Year 9 |
|---|---:|---:|---:|---:|
| Number | 320 | 320 | 320 | 280 |
| Algebra | 80 | 80 | 80 | 120 |
| Measurement | 184 | 160 | 160 | 160 |
| Space | 112 | 112 | 112 | 112 |
| Statistics | 64 | 88 | 88 | 88 |
| Probability | 40 | 40 | 40 | 40 |
| 合计 | 800 | 800 | 800 | 800 |

主要能力包括：

- 选择并应用运算、数感、分数、小数、百分比、比率和有理数；
- 识别模式、未知数、线性关系、代入和指数规律；
- 时间、长度、周长、面积、体积、单位换算、速率和 Pythagoras；
- 形状属性、对称、方向、角、坐标、变换和相似；
- 读取表格、比较数据、均值与中位数；
- 单步及两步概率、样本空间和无放回情境。

## 7. 题型与字段

题库使用：

- `multiple_choice`
- `multiple_select`
- `hot_text`
- `inline_choice`
- `drag_and_drop`
- `matrix`
- `hotspot`
- `text_entry`
- `writing_prompt`

所有交互必须保存与渲染器一致的 response map：多选保存 `answer.values`；拖拽排序保存多个 `answer.targets` 与完整 `answer.placements`；矩阵保存每行对应的 column；hotspot 的可点击区域由 SVG 参数或独立坐标定义，不能把答案烘焙进位图。

关键字段：

- `id`：稳定唯一编号；
- `difficulty`：内部难度；
- `difficulty_model`：本年级难度、跨年级复杂度、认知步骤与校准状态；
- `pathway_band`：lower / average / higher；
- `testlet`：候选路径节点和校准状态；
- `calculator`：not_allowed / allowed / neutral / not_applicable；
- `tool_policy`：calculator、ruler 和 protractor 的题目级开关；
- `stimulus`：文章、表格、听写脚本或写作题卡；
- `media`：图片、SVG、表格、音频及替代文本；
- `interaction`：真实渲染器及选择/拖拽/矩阵约束；
- `scoring`：响应类型、最高原始分和部分分政策；
- `answer`：机器判分答案或写作 rubric 引用；
- `explanation`：学生提交后展示的解析；
- `provenance`：原创及对齐声明。

## 8. 组卷建议

正式模拟卷应按上表的正式题量和时长组卷。推荐流程：

1. 选择年级和科目。
2. 从 lower、average、higher 各抽取一个 testlet 候选池。
3. 第一阶段 A 使用目标年级的中间难度与少量相邻带题目；完成整个 testlet 后才根据 provisional 路由规则进入 B/D 或 C early，不能每答一题就切换难度。
4. Reading 以整篇文章为单位抽取，不拆散 `stimulus.id`。
5. 同一套卷中检查技能覆盖、题型比例、重复概念和计算器状态。
6. 路由后修改旧 testlet 的答案可以改变练习 raw score，但不能重写已经分配的后续路径。
7. 只把本题库正确率用于产品内诊断，不直接换算官方 scale score 或 proficiency level。

## 9. 官方依据

- National Assessment Program, *NAPLAN Assessment Framework*, updated December 2025: <https://nap.edu.au/docs/default-source/naplan/naplan-assessment-framework.pdf>
- What’s in the tests: <https://www.nap.edu.au/naplan/whats-in-the-tests>
- Public demonstration site: <https://www.nap.edu.au/naplan/public-demonstration-site>
- Writing FAQ: <https://www.nap.edu.au/naplan/faqs/naplan--writing-test>
- Proficiency level descriptions: <https://nap.edu.au/naplan/results-and-reports/proficiency-level-descriptions>
