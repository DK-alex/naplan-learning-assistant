export const WRITING_RUBRIC_SOURCES = [
  {
    id: "overview",
    title: "What’s in the tests – Writing",
    publisher: "NAP / ACARA",
    type: "web",
    url: "https://www.nap.edu.au/naplan/whats-in-the-tests",
  },
  {
    id: "narrative-guide",
    title: "NAPLAN Narrative writing marking guide",
    publisher: "ACARA",
    type: "pdf",
    url: "https://www.nap.edu.au/docs/default-source/naplan/narrative-writing-marking-guide.pdf",
  },
  {
    id: "persuasive-guide",
    title: "NAPLAN Persuasive writing marking guide",
    publisher: "ACARA",
    type: "pdf",
    url: "https://www.nap.edu.au/docs/default-source/naplan/persuasive-writing-marking-guide.pdf",
  },
  {
    id: "framework",
    title: "NAPLAN Assessment Framework",
    publisher: "ACARA",
    type: "pdf",
    url: "https://www.nap.edu.au/docs/default-source/naplan/naplan-assessment-framework.pdf",
  },
];

const criterionMeta = {
  audience: { label: "Audience", narrative: 6, persuasive: 6 },
  text_structure: { label: "Text structure", narrative: 4, persuasive: 4 },
  ideas: { label: "Ideas", narrative: 5, persuasive: 5 },
  character_and_setting: { label: "Character and setting", narrative: 4, persuasive: null, unique: true },
  persuasive_devices: { label: "Persuasive devices", narrative: null, persuasive: 4, unique: true },
  vocabulary: { label: "Vocabulary", narrative: 5, persuasive: 5 },
  cohesion: { label: "Cohesion", narrative: 4, persuasive: 4 },
  paragraphing: { label: "Paragraphing", narrative: 2, persuasive: 3 },
  sentence_structure: { label: "Sentence structure", narrative: 6, persuasive: 6 },
  punctuation: { label: "Punctuation", narrative: 5, persuasive: 5 },
  spelling: { label: "Spelling", narrative: 6, persuasive: 6 },
};

const criterionOrder = {
  narrative: [
    "audience",
    "text_structure",
    "ideas",
    "character_and_setting",
    "vocabulary",
    "cohesion",
    "paragraphing",
    "sentence_structure",
    "punctuation",
    "spelling",
  ],
  persuasive: [
    "audience",
    "text_structure",
    "ideas",
    "persuasive_devices",
    "vocabulary",
    "cohesion",
    "paragraphing",
    "sentence_structure",
    "punctuation",
    "spelling",
  ],
};

const zhCN = {
  page: {
    eyebrow: "OFFICIAL WRITING RUBRIC",
    title: "官方写作评分标准详解",
    intro: "NAPLAN 写作考查学生能否使用 Standard Australian English 准确、流畅且有目的地完成一篇连续文本。全国评分员使用相同的官方评分指南、培训和质量控制。",
    languageTitle: "评分说明语言",
    languageBody: "以下是便于家庭理解的忠实概括，不替代官方英文评分指南。英文标准名称和分值保持不变。",
    tenCriteria: "十项标准独立评分",
    sharedNote: "两种文体有 9 项共通标准。Narrative 评 Character and setting；Persuasive 评 Persuasive devices。",
    descriptorNote: "每个分数对应官方指南中的表现描述，并不是把总分简单平均分成“差、中、好”。评分员根据整篇文章中证据的质量、控制度和持续性判断。",
    practiceBoundary: "本软件显示的是练习 rubric 总分。它不能直接换算为官方 scaled score、proficiency level、百分位或全国排名。",
    whatAssesses: "主要评什么",
    higherPerformance: "较高分通常需要",
    uniqueCriterion: "该文体独有标准",
    commonCriterion: "两种文体共通标准",
    sourceTitle: "官方依据与原文",
    sourceBody: "评分指南为 ACARA excluded material，本软件只提供概括和官方原文链接，不复制官方样卷、锚定样本或逐字评分页。",
    openOfficial: "打开官方英文原文",
    officialWeb: "官方网页",
    officialPdf: "官方 PDF",
    translatedSummary: "软件翻译概括",
    attribution: "依据 NAP / ACARA 官方资料整理；英文原文有冲突时，以官方评分指南为准。",
  },
  criteria: {
    audience: {
      description: "评估文章是否让读者容易进入文本，并通过信息选择、语气、叙述声音或论证方式持续吸引和影响读者。",
      higher: "从开头到结尾保持清楚的读者意识；有目的地控制信息量、声音和表达效果，而不是只在个别句子里偶然吸引人。",
    },
    text_structure: {
      description: "Narrative 看开端、事件发展或复杂化、结尾之间是否形成完整推进；Persuasive 看立场、论点组织和结论是否构成清楚论证。",
      higher: "结构选择服务全文目的，各部分比例和顺序受控制；段落之间自然推进，而不是机械套用开头、正文、结尾。",
    },
    ideas: {
      description: "评估核心想法是否相关、清楚并得到扩展。Narrative 关注事件、细节和主题发展；Persuasive 关注理由、解释、例子和证据。",
      higher: "围绕中心持续选择和发展有意义的细节，让想法彼此支持并产生深度，而不是罗列互不相连的观点或事件。",
    },
    character_and_setting: {
      description: "Narrative 独有标准。评估人物与场景是否通过动作、对话、感官、动机和具体描写建立，并对情节或主题产生作用。",
      higher: "人物和场景被持续、具体且有目的地发展；细节不只是装饰，而会推动冲突、选择、氛围或结局。",
    },
    persuasive_devices: {
      description: "Persuasive 独有标准。评估理由、证据、情感或伦理诉求、反问、重复、包容性语言、反驳等手段是否真正帮助说服读者。",
      higher: "多种说服手段与论点自然结合，并根据读者和目的受控制地使用；不会依赖夸张、口号或连续反问来代替论证。",
    },
    vocabulary: {
      description: "评估词汇的范围、准确性和表达效果，包括具体词、主题词、动词、修饰语和恰当语域。此项不重复计算拼写。",
      higher: "词语选择准确、自然且有目的，能细化意义、建立声音或加强论证；不是为了显得高级而堆砌生僻词。",
    },
    cohesion: {
      description: "评估整篇文章的信息流是否连贯，包括指代、连接词、时序、词汇链、时态和句段之间的逻辑关系。",
      higher: "读者能够顺畅追踪人物、事件或论点；衔接手段多样但不显眼，全文不会因跳跃、重复或指代不清而中断。",
    },
    paragraphing: {
      description: "评估是否利用段落组织场景、时间、说话者或相关观点。Narrative 满分 2；Persuasive 因论证层级要求满分 3。",
      higher: "段落边界与内容变化一致，段内集中、段间推进清楚；不是按固定句数机械分段，也不是把整篇写成一个大段。",
    },
    sentence_structure: {
      description: "评估句子是否语法完整，以及简单句、并列句和复杂句的范围与控制，包括从句、主谓一致、时态和句子节奏。",
      higher: "能根据意义有目的地改变句长和结构，复杂句保持清楚准确；偶发错误不会反复破坏理解。",
    },
    punctuation: {
      description: "评估标点是否准确表达句界和内部关系，包括大写、句号、逗号、撇号、引号、问号、感叹号及较复杂标点。",
      higher: "基本句界几乎始终准确，并能受控制地使用内部标点澄清结构、对话、强调或语气。",
    },
    spelling: {
      description: "评估学生能否正确拼写从常用词到较难词，并控制词尾、词形变化和不规则拼写。评分也考虑所尝试词汇的难度范围。",
      higher: "常用词稳定准确，较难和不规则词也有广泛成功；错误较少且不是反复出现的基础模式。",
    },
  },
};

const en = {
  page: {
    eyebrow: "OFFICIAL WRITING RUBRIC",
    title: "Detailed guide to the official writing criteria",
    intro: "NAPLAN Writing assesses whether a student can produce an accurate, fluent and purposeful continuous text in Standard Australian English. Markers nationwide use the same official guides, training and quality-assurance processes.",
    languageTitle: "Guide language",
    languageBody: "This is a faithful family-friendly summary, not a replacement for the official English marking guides. Official criterion names and score limits are retained.",
    tenCriteria: "Ten criteria scored independently",
    sharedNote: "The two text types share nine criteria. Narrative uses Character and setting; Persuasive uses Persuasive devices.",
    descriptorNote: "Each score has its own performance descriptor in the official guide. The scale is not a simple split into low, medium and high: markers judge the quality, control and consistency of evidence across the whole text.",
    practiceBoundary: "The app shows a practice rubric total. It cannot be converted directly to an official scaled score, proficiency level, percentile or national ranking.",
    whatAssesses: "What it mainly assesses",
    higherPerformance: "Higher performance usually requires",
    uniqueCriterion: "Unique to this text type",
    commonCriterion: "Shared by both text types",
    sourceTitle: "Official basis and source documents",
    sourceBody: "The marking guides are ACARA excluded material. This app provides summaries and official links only; it does not reproduce official scripts, anchor samples or marking pages.",
    openOfficial: "Open official English source",
    officialWeb: "Official webpage",
    officialPdf: "Official PDF",
    translatedSummary: "App summary",
    attribution: "Prepared from official NAP / ACARA material. If wording differs, the official English marking guide takes precedence.",
  },
  criteria: {
    audience: {
      description: "Assesses how well the text orients, engages and affects the reader through the selection of information, tone, narrative voice or argument.",
      higher: "Sustained reader awareness from beginning to end, with deliberate control of information, voice and effect rather than one isolated engaging sentence.",
    },
    text_structure: {
      description: "Narrative considers how orientation, development or complication and ending create movement. Persuasive considers how the position, arguments and conclusion form a coherent case.",
      higher: "Structural choices serve the whole-text purpose, with controlled sequencing and proportion instead of a mechanical introduction–body–conclusion template.",
    },
    ideas: {
      description: "Assesses whether central ideas are relevant, clear and developed. Narrative focuses on events, detail and thematic development; Persuasive focuses on reasons, explanation, examples and evidence.",
      higher: "Sustained selection and elaboration of meaningful detail, with ideas supporting one another rather than appearing as an unrelated list.",
    },
    character_and_setting: {
      description: "The Narrative-only criterion. It assesses how action, dialogue, sensory detail, motivation and description establish characters and settings that matter to the story.",
      higher: "Characters and settings are developed specifically and purposefully; details influence conflict, choices, atmosphere or resolution rather than merely decorating the text.",
    },
    persuasive_devices: {
      description: "The Persuasive-only criterion. It assesses whether reasons, evidence, emotional or ethical appeals, rhetorical questions, repetition, inclusive language and rebuttal help persuade the reader.",
      higher: "A controlled range of devices is integrated with the reasoning and adapted to audience and purpose, without substituting slogans, exaggeration or repeated questions for argument.",
    },
    vocabulary: {
      description: "Assesses the range, precision and effect of word choices, including specific and topic vocabulary, verbs, modifiers and register. Spelling is scored separately.",
      higher: "Accurate, natural and purposeful choices that refine meaning, create voice or strengthen argument—not difficult words added only to sound sophisticated.",
    },
    cohesion: {
      description: "Assesses whole-text flow through reference, connectives, time sequence, lexical chains, tense and logical relationships between sentences and paragraphs.",
      higher: "The reader can track people, events or arguments smoothly. Links are varied and unobtrusive, with few disruptions from jumps, repetition or unclear reference.",
    },
    paragraphing: {
      description: "Assesses how paragraphs organise scenes, time, speakers or related ideas. Narrative has a maximum of 2; Persuasive has a maximum of 3 because argument hierarchy is assessed.",
      higher: "Boundaries match meaningful content changes, with focused paragraphs and clear progression—not arbitrary paragraphing by sentence count or one unbroken block.",
    },
    sentence_structure: {
      description: "Assesses grammatical completeness and the range and control of simple, compound and complex sentences, including clauses, agreement, tense and rhythm.",
      higher: "Purposeful variation in sentence length and construction, with controlled complex sentences and only occasional errors that do not repeatedly disrupt meaning.",
    },
    punctuation: {
      description: "Assesses sentence boundaries and internal punctuation, including capitals, full stops, commas, apostrophes, quotation marks, question marks, exclamation marks and more complex marks.",
      higher: "Sentence punctuation is consistently accurate and internal punctuation is controlled to clarify structure, dialogue, emphasis or tone.",
    },
    spelling: {
      description: "Assesses correct spelling from common to difficult words, including endings, word forms and irregular patterns. The difficulty range of attempted words also matters.",
      higher: "Common words are consistently correct and a broad range of difficult or irregular words is successful, with few repeated basic error patterns.",
    },
  },
};

const zhTW = {
  page: {
    eyebrow: "OFFICIAL WRITING RUBRIC",
    title: "官方寫作評分標準詳解",
    intro: "NAPLAN 寫作評估學生能否以 Standard Australian English 準確、流暢且有目的地完成一篇連續文本。全國評分員使用相同的官方指南、培訓與品質控制。",
    languageTitle: "評分說明語言",
    languageBody: "以下是便於家庭理解的忠實概括，不取代官方英文評分指南。英文標準名稱與分值保持不變。",
    tenCriteria: "十項標準獨立評分",
    sharedNote: "兩種文體有 9 項共通標準。Narrative 評 Character and setting；Persuasive 評 Persuasive devices。",
    descriptorNote: "每個分數在官方指南中都有對應表現描述，並非把總分簡單分成低、中、高。評分員會判斷整篇文章中證據的品質、控制度與持續性。",
    practiceBoundary: "本軟體顯示的是練習 rubric 總分，不能直接換算為官方 scaled score、proficiency level、百分位或全國排名。",
    whatAssesses: "主要評估內容",
    higherPerformance: "較高分通常需要",
    uniqueCriterion: "該文體獨有標準",
    commonCriterion: "兩種文體共通標準",
    sourceTitle: "官方依據與原文",
    sourceBody: "評分指南屬於 ACARA excluded material。本軟體只提供概括與官方連結，不複製官方樣卷、錨定樣本或逐字評分頁。",
    openOfficial: "開啟官方英文原文",
    officialWeb: "官方網頁",
    officialPdf: "官方 PDF",
    translatedSummary: "軟體翻譯概括",
    attribution: "依據 NAP／ACARA 官方資料整理；如文字有差異，以官方英文評分指南為準。",
  },
  criteria: {
    audience: {
      description: "評估文章是否讓讀者容易進入文本，並透過資訊選擇、語氣、敘述聲音或論證方式持續吸引與影響讀者。",
      higher: "從開頭到結尾保持清楚的讀者意識，有目的地控制資訊、聲音與效果，而不是只靠個別吸引人的句子。",
    },
    text_structure: {
      description: "Narrative 看開端、事件發展或複雜化與結尾是否形成完整推進；Persuasive 看立場、論點組織與結論是否構成清楚論證。",
      higher: "結構選擇服務全文目的，各部分次序與比例受控制，而不是機械套用開頭、正文、結尾。",
    },
    ideas: {
      description: "評估核心想法是否相關、清楚並得到擴展。Narrative 關注事件、細節與主題；Persuasive 關注理由、解釋、例子與證據。",
      higher: "持續選擇與發展有意義的細節，讓想法彼此支持，而不是列出互不相連的觀點或事件。",
    },
    character_and_setting: {
      description: "Narrative 獨有標準。評估人物與場景是否透過動作、對話、感官、動機與具體描寫建立，並對情節產生作用。",
      higher: "人物與場景被持續、具體且有目的地發展；細節會推動衝突、選擇、氣氛或結局，而不只是裝飾。",
    },
    persuasive_devices: {
      description: "Persuasive 獨有標準。評估理由、證據、情感或倫理訴求、反問、重複、包容性語言與反駁是否真正幫助說服讀者。",
      higher: "多種說服手段與論點自然結合，並依讀者和目的受控制地使用，不以口號、誇張或連續反問取代論證。",
    },
    vocabulary: {
      description: "評估詞彙的範圍、準確性與效果，包括具體詞、主題詞、動詞、修飾語和適當語域；拼寫另行評分。",
      higher: "詞語選擇準確、自然且有目的，能細化意義、建立聲音或加強論證，而非堆砌艱深詞語。",
    },
    cohesion: {
      description: "評估全文資訊流是否連貫，包括指代、連接詞、時序、詞彙鏈、時態，以及句段之間的邏輯關係。",
      higher: "讀者能順暢追蹤人物、事件或論點；銜接方式多樣而自然，很少因跳躍、重複或指代不清而中斷。",
    },
    paragraphing: {
      description: "評估是否以段落組織場景、時間、說話者或相關觀點。Narrative 滿分 2；Persuasive 因論證層級要求滿分 3。",
      higher: "段落邊界配合內容變化，段內集中、段間推進清楚；不按固定句數機械分段，也不把全文寫成一大段。",
    },
    sentence_structure: {
      description: "評估句子是否語法完整，以及簡單句、並列句和複雜句的範圍與控制，包括從句、主謂一致、時態與節奏。",
      higher: "能依意義改變句長與結構，複雜句保持清楚準確；偶發錯誤不會反覆影響理解。",
    },
    punctuation: {
      description: "評估標點能否準確表達句界與內部關係，包括大寫、句號、逗號、撇號、引號、問號、驚嘆號及較複雜標點。",
      higher: "基本句界幾乎始終準確，並能受控制地使用內部標點來澄清結構、對話、強調或語氣。",
    },
    spelling: {
      description: "評估從常用詞到較難詞的拼寫，包括詞尾、詞形變化與不規則拼寫；所嘗試詞彙的難度範圍也會納入考量。",
      higher: "常用詞穩定準確，較難與不規則詞也有廣泛成功，錯誤少且不是重複的基礎模式。",
    },
  },
};

const ko = {
  page: {
    eyebrow: "OFFICIAL WRITING RUBRIC",
    title: "공식 글쓰기 채점 기준 상세 안내",
    intro: "NAPLAN Writing은 학생이 Standard Australian English로 정확하고 유창하며 목적에 맞는 연속 글을 작성하는 능력을 평가합니다. 전국 채점자는 동일한 공식 지침, 교육 및 품질 관리 절차를 사용합니다.",
    languageTitle: "채점 안내 언어",
    languageBody: "아래 내용은 가정의 이해를 돕기 위한 충실한 요약이며 공식 영어 채점 지침을 대체하지 않습니다. 영어 기준명과 점수 범위는 그대로 유지합니다.",
    tenCriteria: "10개 기준을 독립적으로 채점",
    sharedNote: "두 글 유형은 9개 기준을 공유합니다. Narrative는 Character and setting, Persuasive는 Persuasive devices를 평가합니다.",
    descriptorNote: "공식 지침에는 각 점수에 해당하는 수행 설명이 있습니다. 단순히 낮음·중간·높음으로 나누는 것이 아니라 글 전체에서 보이는 근거의 질, 통제력 및 지속성을 판단합니다.",
    practiceBoundary: "앱의 점수는 연습용 rubric 총점입니다. 공식 scaled score, proficiency level, 백분위 또는 전국 순위로 직접 환산할 수 없습니다.",
    whatAssesses: "주요 평가 내용",
    higherPerformance: "높은 점수에 일반적으로 필요한 것",
    uniqueCriterion: "이 글 유형의 고유 기준",
    commonCriterion: "두 글 유형의 공통 기준",
    sourceTitle: "공식 근거와 원문",
    sourceBody: "채점 지침은 ACARA excluded material입니다. 이 앱은 요약과 공식 링크만 제공하며 공식 학생 글, 기준 표본 또는 채점 페이지를 복제하지 않습니다.",
    openOfficial: "공식 영어 원문 열기",
    officialWeb: "공식 웹페이지",
    officialPdf: "공식 PDF",
    translatedSummary: "앱 번역 요약",
    attribution: "NAP / ACARA 공식 자료를 바탕으로 정리했습니다. 문구가 다르면 공식 영어 채점 지침을 우선합니다.",
  },
  criteria: {
    audience: {
      description: "정보 선택, 어조, 서술 목소리 또는 논증을 통해 독자가 글에 들어오고 계속 관심을 가지며 영향을 받도록 하는 정도를 평가합니다.",
      higher: "처음부터 끝까지 독자를 분명히 의식하고 정보, 목소리와 효과를 의도적으로 통제해야 하며 한두 문장만 흥미로운 것으로는 충분하지 않습니다.",
    },
    text_structure: {
      description: "Narrative는 도입, 사건의 전개·복잡화와 결말의 진행을, Persuasive는 입장, 논점 구성과 결론이 명확한 논증을 이루는지 평가합니다.",
      higher: "구조가 글 전체의 목적을 지원하고 순서와 비중이 통제되어야 하며 도입–본문–결론 틀을 기계적으로 따르는 데 그치지 않아야 합니다.",
    },
    ideas: {
      description: "핵심 아이디어가 관련 있고 명확하며 충분히 발전했는지 평가합니다. Narrative는 사건·세부·주제를, Persuasive는 이유·설명·예시·근거를 봅니다.",
      higher: "의미 있는 세부를 지속적으로 선택하고 발전시켜 아이디어가 서로 뒷받침되어야 하며 관련 없는 생각의 나열이 아니어야 합니다.",
    },
    character_and_setting: {
      description: "Narrative 고유 기준입니다. 행동, 대화, 감각, 동기와 구체적 묘사를 통해 인물과 배경이 만들어지고 이야기에서 기능하는지 평가합니다.",
      higher: "인물과 배경이 지속적이고 구체적이며 목적 있게 발전하고, 세부가 갈등·선택·분위기 또는 결말에 영향을 주어야 합니다.",
    },
    persuasive_devices: {
      description: "Persuasive 고유 기준입니다. 이유, 근거, 감정·윤리적 호소, 수사 질문, 반복, 포괄적 언어와 반박이 독자를 설득하는지 평가합니다.",
      higher: "여러 설득 장치가 논리와 자연스럽게 결합되고 독자와 목적에 맞게 통제되어야 하며 구호, 과장 또는 반복 질문이 논증을 대신해서는 안 됩니다.",
    },
    vocabulary: {
      description: "구체어, 주제어, 동사, 수식어와 문체를 포함한 어휘의 범위, 정확성 및 효과를 평가합니다. 철자는 별도 기준입니다.",
      higher: "의미를 정교하게 하거나 목소리와 논증을 강화하는 정확하고 자연스러운 단어 선택이 필요하며 어려운 단어를 과시적으로 넣는 것은 충분하지 않습니다.",
    },
    cohesion: {
      description: "지시어, 연결어, 시간 순서, 어휘 연결, 시제 및 문장·문단 사이의 논리 관계를 통해 글 전체가 자연스럽게 이어지는지 평가합니다.",
      higher: "독자가 인물, 사건 또는 논점을 쉽게 따라가고 연결 방식이 다양하면서 자연스러워야 하며 비약, 반복 또는 불분명한 지시가 거의 없어야 합니다.",
    },
    paragraphing: {
      description: "문단이 장면, 시간, 화자 또는 관련 아이디어를 조직하는지 평가합니다. Narrative는 2점, Persuasive는 논증 계층 때문에 3점이 최대입니다.",
      higher: "문단 경계가 의미 있는 내용 변화와 맞고 문단 안은 집중되며 문단 사이 진행이 분명해야 합니다. 문장 수로 기계적으로 나누거나 한 덩어리로 쓰지 않습니다.",
    },
    sentence_structure: {
      description: "문장의 문법적 완전성과 단문, 중문, 복문의 범위와 통제를 평가하며 절, 일치, 시제 및 리듬을 포함합니다.",
      higher: "의미에 맞게 문장 길이와 구조를 의도적으로 바꾸고 복문을 명확하고 정확하게 통제하며 반복적으로 이해를 방해하는 오류가 없어야 합니다.",
    },
    punctuation: {
      description: "대문자, 마침표, 쉼표, 아포스트로피, 인용 부호, 물음표, 느낌표와 복잡한 문장 부호를 포함해 문장 경계와 내부 관계를 정확히 표시하는지 평가합니다.",
      higher: "기본 문장 부호가 거의 항상 정확하고 내부 문장 부호를 통제해 구조, 대화, 강조 또는 어조를 명확히 해야 합니다.",
    },
    spelling: {
      description: "일반 단어부터 어려운 단어까지 어미, 단어 형태와 불규칙 철자를 정확히 쓰는지 평가하며 시도한 어휘의 난도 범위도 고려합니다.",
      higher: "일반 단어는 일관되게 정확하고 어려운·불규칙 단어도 폭넓게 성공하며 반복되는 기본 오류가 거의 없어야 합니다.",
    },
  },
};

const guides = {
  "zh-CN": zhCN,
  en,
  "zh-TW": zhTW,
  ko,
};

export function getWritingRubricGuide(language, genre = "narrative") {
  const safeGenre = genre === "persuasive" ? "persuasive" : "narrative";
  const copy = guides[language] || guides["zh-CN"];
  const criteria = criterionOrder[safeGenre].map((key) => ({
    key,
    ...criterionMeta[key],
    maximum: criterionMeta[key][safeGenre],
    ...copy.criteria[key],
  }));
  return {
    ...copy.page,
    genre: safeGenre,
    maximum: criteria.reduce((sum, criterion) => sum + criterion.maximum, 0),
    criteria,
    sources: WRITING_RUBRIC_SOURCES,
  };
}
