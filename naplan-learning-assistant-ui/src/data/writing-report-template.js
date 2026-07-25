export const WRITING_REPORT_TEMPLATE_ID = "writing-report-template-one-minute-too-late";
export const WRITING_REPORT_TEMPLATE_ASSET = "/templates/NAPLAN-Writing-Report-Example-zh-CN.docx";

const studentText = `One Minute Too Late

“Wake up, Max!” Mum called from downstairs.

Max opened his eyes and looked at his clock. It was 7:45 in the morning.

“Oh no!” he shouted. “The school bus comes at eight!”

Today was not a normal school day. Max’s class was going to the zoo, and he had been waiting for the trip all week. He jumped out of bed, pulled on his uniform and ran downstairs with one sock on.

Mum handed him a piece of toast and his blue backpack.

“Have you packed your lunch?” she asked.

“Yes!” Max said, although he was not completely sure.

They rushed outside. The morning air was cold, and dark clouds covered the sky. Max and Mum ran down the footpath towards the bus stop.

As they turned the corner, Max saw the yellow school bus.

“Wait!” he yelled.

The bus doors closed. It slowly moved away from the footpath.

Max ran as fast as he could, waving both arms.

“Stop! Please stop!”

But the driver did not see him. The bus disappeared around the corner.

Max looked at Mum’s phone. It was 8:01.

He was one minute too late.

Max sat on the wet grass and hung his head.

“I have missed the zoo trip,” he said sadly.

Just then, Mum’s phone rang. It was Max’s teacher, Mrs Brown.

“The bus has a flat tyre,” Mrs Brown explained. “We are waiting near the school. Can you bring Max here?”

Max jumped up so quickly that he almost dropped his backpack.

Mum drove him to school. When they arrived, all his classmates were standing beside the bus. His best friend, Leo, waved at him.

“You made it!” Leo called.

Max smiled and climbed onto the bus.

Later that morning, Max stood beside the lion enclosure. A huge lion opened its mouth and gave a mighty roar.

Max laughed. Being one minute late had almost ruined his day, but this time, one flat tyre had saved it.`;

const exemplarText = `The clock above the bakery door clicked to ten o’clock.

Ruby stopped at the end of the street and stared at it.

“One minute too late,” she whispered.

She had spent all morning carrying a chocolate cake to the town hall for the Junior Baking Contest. Now the doors were closed, and a bright sign said: ENTRIES FINISHED AT 9:59.

Ruby’s arms ached. Rainwater dripped from her yellow coat, and the cake box felt heavier than a suitcase full of rocks.

“I should have taken the shortcut,” she groaned.

But Ruby knew why she was late.

Near the duck pond, she had heard a tiny squeak. A duckling was trapped between two slippery stones while its mother flapped and quacked nearby. Ruby had put down her cake, stepped into the mud and gently lifted the trembling duckling to safety.

Helping it had taken exactly three minutes.

Ruby sighed and turned away from the hall. Just then, the door opened.

A woman wearing a tall white chef’s hat hurried outside. “Wait!” she called. “Are you the girl who rescued the duckling?”

Ruby blinked. “Yes, but I missed the contest.”

The woman smiled. “I’m Chef Lin, one of the judges. I saw what you did from the hall window.”

Ruby held out the damp cake box. One corner had bent, and the chocolate icing leaned to one side.

“It doesn’t look perfect anymore,” Ruby admitted.

Chef Lin opened the box. On top of the cake, Ruby had made a pond from blue icing and shaped six tiny ducks from yellow sugar. One duck had fallen over, but it still looked cheerful.

“The rules say I cannot enter it after 9:59,” Chef Lin said.

Ruby’s heart sank.

“However,” the chef continued, “the contest café opens at ten. We need one special cake to serve to our visitors. May we use yours?”

Ruby’s eyes widened. “Really?”

Together, they carried the cake inside. Soon, people were buying slices, and Ruby heard them praising its rich chocolate centre. Chef Lin placed a new card beside the empty plate. It read: THE KINDNESS CAKE—SOLD OUT.

Ruby smiled as she looked through the window at the duck pond.

She had been one minute too late to win a ribbon, but just in time to do something better.`;

const report = {
  rubric_version: "naplan-writing-practice-v1",
  status: "scorable",
  year_level: 3,
  genre: "narrative",
  score_type: "practice_only_not_official",
  report_language: "zh-CN",
  total_score: 45,
  maximum_score: 47,
  confidence: "high",
  overall_summary: "这是一篇完成度很高的三年级叙事文。文章紧扣“One Minute Too Late”，通过起床晚、追赶校车、错过校车和意外赶上旅行，建立了清楚而有趣的情节弧线。对话、动作和时间提示有效制造紧张感，结尾也与标题形成呼应。若要进一步提升，可以增加更独特的情节细节、人物内心变化和更精准多样的词汇。",
  strengths: [
    {
      title: "紧张感建立迅速",
      evidence: "从“It was 7:45 in the morning.”到“The school bus comes at eight!”立即给出明确的时间限制。",
      impact: "读者很快理解主人公的目标和风险，愿意继续阅读他能否赶上校车。",
    },
    {
      title: "结构完整且转折有效",
      evidence: "“The bus has a flat tyre”使已经错过校车的问题出现合理转机。",
      impact: "故事既有失望的低点，也有令人满意的解决，形成完整的叙事弧线。",
    },
    {
      title: "动作和场景描写具体",
      evidence: "“ran downstairs with one sock on”和“sat on the wet grass and hung his head”把慌张与难过转化为可见动作。",
      impact: "读者无需依赖直接说明，也能理解人物情绪。",
    },
    {
      title: "语言技术控制稳定",
      evidence: "全文对话标点准确，句式多样，较难单词拼写正确。",
      impact: "技术错误没有干扰故事，阅读过程流畅清楚。",
    },
  ],
  priorities: [
    {
      criterion: "ideas",
      issue: "主要问题与解决方式清楚，但转机较直接，故事的独特性还可以增强。",
      evidence: "教师来电直接解决了错过校车的问题。",
      why_it_matters: "更有层次的障碍能让人物选择和故事发展更有力量。",
      action: "在教师来电之后增加一个小挑战，并让Max采取行动解决，而不只是被动地得到好消息。",
      micro_example: "Mum’s car would not start, so Max had to think of another way to reach the school.",
    },
    {
      criterion: "vocabulary",
      issue: "词汇准确，但部分动作和情绪表达较常见。",
      evidence: "Max ran.",
      why_it_matters: "少量精准动词能让关键画面更鲜明。",
      action: "选择两三个最重要的动作进行升级，不必替换每个普通词。",
      micro_example: "可把“Max ran”改写为“Max sprinted along the slippery footpath”。",
    },
    {
      criterion: "character_and_setting",
      issue: "人物情绪主要通过动作和直接说明呈现，内心想法较少。",
      evidence: "I have missed the zoo trip,” he said sadly.",
      why_it_matters: "具体的内心反应能让情绪变化更细腻。",
      action: "在最低落的时刻加入一句简短而具体的想法或回忆。",
      micro_example: "He imagined Leo seeing the lions without him, and his stomach seemed to sink.",
    },
    {
      criterion: "audience",
      issue: "结尾成功呼应标题，但人物经历带来的变化可以再明确一点。",
      evidence: "Being one minute late had almost ruined his day, but this time, one flat tyre had saved it.",
      why_it_matters: "人物变化能让结尾给读者留下更深印象。",
      action: "保留现有呼应，再加入一句体现人物以后会如何行动的细节。",
      micro_example: "That night, Max set two alarms—and placed both socks beside his bed.",
    },
  ],
  annotations: [
    {
      quote: "He jumped out of bed, pulled on his uniform and ran downstairs with one sock on.",
      criterion: "character_and_setting",
      tone: "strength",
      comment: "三个连续动作制造速度感，“one sock on”是具体而幽默的细节。",
    },
    {
      quote: "The morning air was cold, and dark clouds covered the sky.",
      criterion: "vocabulary",
      tone: "strength",
      comment: "天气描写建立了清冷、紧张的气氛，也为后面的湿草地提供了场景联系。",
    },
    {
      quote: "The bus doors closed. It slowly moved away from the footpath.",
      criterion: "sentence_structure",
      tone: "strength",
      comment: "两个简短句放慢关键瞬间，让读者清楚感受到Max即将错过校车。",
    },
    {
      quote: "I have missed the zoo trip,” he said sadly.",
      criterion: "character_and_setting",
      tone: "improve",
      comment: "意思清楚，但“sadly”直接告诉读者情绪；可以加入更具体的想法、声音或身体感受。",
    },
    {
      quote: "Just then, Mum’s phone rang.",
      criterion: "text_structure",
      tone: "strength",
      comment: "这是位置准确的转折句，从最低点自然引出解决过程。",
    },
    {
      quote: "Being one minute late had almost ruined his day, but this time, one flat tyre had saved it.",
      criterion: "audience",
      tone: "strength",
      comment: "结尾同时回扣标题和主要转折，使故事获得清楚而令人满意的收束。",
    },
  ],
  criteria: [
    {
      key: "audience",
      label: "Audience",
      score: 6,
      max_score: 6,
      evidence: [
        "“Oh no!” he shouted. “The school bus comes at eight!”",
        "The bus doors closed. It slowly moved away from the footpath.",
        "Being one minute late had almost ruined his day, but this time, one flat tyre had saved it.",
      ],
      rationale: "文章从开头迅速建立时间压力，并通过追车、失望和意外转机持续吸引读者。标题中的“一分钟”不仅推动情节，也在结尾得到有意义的回应，显示出很强的读者意识。",
      next_step: "继续尝试让转机带来更深一层的感受或领悟，使读者在情节结束后仍能思考人物的经历。",
    },
    {
      key: "text_structure",
      label: "Text structure",
      score: 4,
      max_score: 4,
      evidence: [
        "Today was not a normal school day.",
        "But the driver did not see him. The bus disappeared around the corner.",
        "Just then, Mum’s phone rang.",
      ],
      rationale: "文章具备完整而清楚的开端、发展、问题、转机和结局。事件按照时间顺序推进，关键转折放置自然，结尾收束完整。",
      next_step: "可以在最紧张的时刻短暂停顿，加入一两个感官或心理细节，使高潮更突出。",
    },
    {
      key: "ideas",
      label: "Ideas",
      score: 4,
      max_score: 5,
      evidence: [
        "Max’s class was going to the zoo, and he had been waiting for the trip all week.",
        "The bus has a flat tyre,” Mrs Brown explained.",
        "A huge lion opened its mouth and gave a mighty roar.",
      ],
      rationale: "核心构思明确，错过校车与爆胎转机之间有合理联系。动物园、朋友和狮子等细节让故事完整。不过，情节解决方式较直接，部分内容仍可进一步展开或增加独特性。",
      next_step: "加入一个只属于这个故事的小障碍或选择，例如书包里少了重要物品，或主人公必须决定是否停下来帮助别人。",
    },
    {
      key: "character_and_setting",
      label: "Character and setting",
      score: 4,
      max_score: 4,
      evidence: [
        "He jumped out of bed, pulled on his uniform and ran downstairs with one sock on.",
        "The morning air was cold, and dark clouds covered the sky.",
        "Max sat on the wet grass and hung his head.",
      ],
      rationale: "人物通过动作、对话和身体姿态表现出慌张、失望与兴奋。冷空气、乌云、湿草地和狮子围栏等场景细节能够支持气氛与情节。",
      next_step: "在关键转折前加入一句人物内心想法，让情绪变化从失望到希望更加细腻。",
    },
    {
      key: "vocabulary",
      label: "Vocabulary",
      score: 4,
      max_score: 5,
      evidence: ["dark clouds covered the sky", "waving both arms", "gave a mighty roar"],
      rationale: "词汇清楚、自然并适合三年级叙事，动作词和描述词能帮助读者想象场景。部分表达较常见，尚未持续展现更精准或新颖的语言选择。",
      next_step: "修改时寻找两三个普通动词或描述，例如“ran”“said”“looked”，换成更能表现方式或情绪的词，但不要为了复杂而堆砌词语。",
    },
    {
      key: "cohesion",
      label: "Cohesion",
      score: 4,
      max_score: 4,
      evidence: ["As they turned the corner", "Just then", "When they arrived"],
      rationale: "代词指代清楚，时间连接语有效引导事件发展。有关时间、校车和旅行的线索贯穿全文，各段之间衔接自然。",
      next_step: "继续保持清楚的时间线，同时尝试减少个别连续使用人物姓名开头的句子，以增加行文变化。",
    },
    {
      key: "paragraphing",
      label: "Paragraphing",
      score: 2,
      max_score: 2,
      evidence: [
        "“Wake up, Max!” Mum called from downstairs.",
        "They rushed outside.",
        "Later that morning, Max stood beside the lion enclosure.",
      ],
      rationale: "段落能够标示说话者变化、动作推进、转折和场景转换。短段落也在追赶校车的部分有效加快了阅读节奏。",
      next_step: "在较长的课堂写作中，可将紧密相关的动作与描写组成稍完整的段落，同时保留短段落来突出关键时刻。",
    },
    {
      key: "sentence_structure",
      label: "Sentence structure",
      score: 6,
      max_score: 6,
      evidence: [
        "Max’s class was going to the zoo, and he had been waiting for the trip all week.",
        "“Yes!” Max said, although he was not completely sure.",
        "Max jumped up so quickly that he almost dropped his backpack.",
      ],
      rationale: "文章能够稳定控制简单句、并列句和包含从句的复杂句。长短句搭配符合叙事节奏，对话句和陈述句也使用自然，未见影响理解的语法问题。",
      next_step: "继续用短句突出紧张动作，并用较长句解释原因、感受或结果，保持这种有目的的句式变化。",
    },
    {
      key: "punctuation",
      label: "Punctuation",
      score: 5,
      max_score: 5,
      evidence: [
        "“Have you packed your lunch?” she asked.",
        "“Stop! Please stop!”",
        "Being one minute late had almost ruined his day, but this time, one flat tyre had saved it.",
      ],
      rationale: "句号、逗号、问号、感叹号、撇号及直接引语标点均得到准确控制。标点不仅正确，也能帮助表达语气和节奏。",
      next_step: "誊写或检查时继续重点核对引号、问号和说话提示语的位置，以保持准确性。",
    },
    {
      key: "spelling",
      label: "Spelling",
      score: 6,
      max_score: 6,
      evidence: ["completely", "disappeared", "enclosure"],
      rationale: "常用词及较有难度的词均拼写正确，全文未见明显拼写错误，显示出稳定的拼写控制。",
      next_step: "继续积累与场景和情绪有关的词汇，并在完成写作后逐词检查较长单词。",
    },
  ],
  error_patterns: { spelling: [], punctuation: [], grammar: [] },
  revision_plan: [
    { step: 1, minutes: 3, task: "圈出故事中情绪最强的三个时刻：发现迟到、看见校车离开、接到教师电话。" },
    { step: 2, minutes: 5, task: "在其中一个时刻加入一句具体的内心想法，并在另一个时刻加入声音、触感或景物细节。" },
    { step: 3, minutes: 4, task: "检查“ran”“said”“looked”等普通词，只替换两三个最值得加强的动词。" },
    { step: 4, minutes: 5, task: "考虑在教师来电后加入一个很短的新障碍，让Max主动想办法解决。" },
    { step: 5, minutes: 3, task: "朗读全文，检查段落节奏、引号、句末标点和较长单词。" },
  ],
  parent_summary: "这篇文章在三年级水平上表现突出，结构完整、情节清楚，对话标点和拼写控制尤其稳定。孩子已经能够用动作、天气和时间制造紧张感。下一阶段可重点练习更独特的情节发展、人物内心描写及少量精准动词。家长誊写这一录入方式不影响本次评价；报告按所提供的学生原文进行评估。",
  student_message: "你写出了一个紧张、有转折而且结尾完整的故事。读者能清楚感受到Max从慌张到失望，再到惊喜的变化。下一次可以给人物增加一句具体的内心想法，再设计一个需要他亲自解决的小障碍。这样，你的故事会更独特，也会更有力量。",
  safeguarding_note: null,
  limitations: [
    "本报告仅用于NAPLAN风格写作练习和形成性反馈，不是官方评分。",
    "评分只依据所提供的文本，未推断量表分数、能力等级、百分位、分段或全国排名。",
    "文本由家长按原纸面作品誊写；录入方式未被奖励或扣分，也未假定使用了OCR。",
  ],
  exemplar: {
    title: "One Minute Too Late",
    text: exemplarText,
    why_full_mark: [
      "开头立即呈现“一分钟太晚”的核心问题，并迅速建立人物目标和读者兴趣。",
      "结构包含清楚的背景、原因揭示、困难、再次受挫、合理解决和主题性结尾。",
      "人物通过选择、动作、对话和情绪变化得到发展，雨天街道、池塘、会场和蛋糕等场景细节贯穿全文。",
      "词汇具体而适龄，句子长短有变化，对话、标点、拼写及段落控制稳定。",
      "结尾不仅呼应标题，也表现出人物对善意与成功的新理解。",
    ],
  },
};

export const WRITING_REPORT_TEMPLATE_RECORD = {
  id: WRITING_REPORT_TEMPLATE_ID,
  practice_id: "writing-report-template",
  is_template: true,
  template_asset: WRITING_REPORT_TEMPLATE_ASSET,
  student_name: "William",
  prompt_title: "One Minute Too Late",
  prompt_instructions: "Create characters and a setting. Build a problem or complication, then show what happens.",
  student_text: studentText,
  response_entry_method: "parent_transcribed",
  word_count: studentText.trim().split(/\s+/).length,
  year_level: 3,
  provider: "openai",
  model: "gpt-5.6-sol",
  generated_at: "2026-07-24T09:36:00.000Z",
  report,
  report_versions: { "zh-CN": report },
};

export function getWritingReportTemplateById(reportId) {
  return reportId === WRITING_REPORT_TEMPLATE_ID ? WRITING_REPORT_TEMPLATE_RECORD : null;
}
