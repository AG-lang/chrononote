import { Topic, NoteEntry } from '../types';
import { getTodayDateString } from './dateUtils';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'reading',
    name: '读书思考',
    icon: 'BookOpen',
    color: '#8b5cf6', // Violet
    description: '读书笔记、核心概念摘录与深度心智启发'
  },
  {
    id: 'journal',
    name: '岁月日记',
    icon: 'Feather',
    color: '#10b981', // Emerald
    description: '记录日常温度、生活琐屑与心境起伏'
  },
  {
    id: 'thought',
    name: '灵感闪念',
    icon: 'Sparkles',
    color: '#f59e0b', // Amber
    description: '捕捉脑海中稍纵即逝的思维火花与创新点子'
  },
  {
    id: 'review',
    name: '复盘精进',
    icon: 'Compass',
    color: '#3b82f6', // Blue
    description: '目标检视、周度/月度得失回顾与系统迭代'
  },
  {
    id: 'movie',
    name: '光影留声',
    icon: 'Film',
    color: '#ec4899', // Pink
    description: '电影、纪录片、音乐及艺术作品赏析'
  },
  {
    id: 'work',
    name: '深度工作',
    icon: 'Briefcase',
    color: '#6366f1', // Indigo
    description: '项目规划、架构方案与技术探索'
  }
];

export const INITIAL_SAMPLE_NOTES: NoteEntry[] = [
  {
    id: 'sample-reading-1',
    date: getTodayDateString(),
    topicId: 'reading',
    title: '《设计心理学》：概念模型与意符的张力',
    mood: '💡',
    rating: 5,
    tags: ['认知设计', '读书笔记', '人机交互'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: true,
    content: `# 《设计心理学》核心概念反思

> “当物品发生故障或让人感到挫败时，错的通常是设计，而不是用户。” —— 唐·诺曼

今天重读诺曼的经典论述，对**示能 (Affordance)** 与 **意符 (Signifier)** 的辨析有了更深的体悟。

---

### 一、 核心要点结构表

| 维度 | 示能 (Affordance) | 意符 (Signifier) |
| :--- | :--- | :--- |
| **定义** | 物理世界或数字界面中“可能发生的操作” | 提示用户“该如何操作”的任何信号 |
| **存在性** | 客观存在，即便未被察觉 | 主观被接收，必须能被感知 |
| **例子** | 门上的把手可以拉动 | 把手上标注的“拉”或特定推板设计 |

### 二、 实践反思点

- [x] 审查产品界面中隐藏的操作盲区
- [x] 去除多余的文字说明，让视觉隐喻自然呈现
- [ ] 优化双栏编辑器的视觉流动性，确保行距和留白舒适

\`\`\`typescript
// 代码块与高亮示例
interface InteractionDesign {
  affordance: string;
  signifier: string;
  feedbackLatencyMs: number;
}

const perfectUI: InteractionDesign = {
  affordance: "Clickable calendar cell",
  signifier: "Glowing dot with soft hover elevation",
  feedbackLatencyMs: 16
};
\`\`\`

> 💡 **今日心境随想**：优秀的软件界面不应该让用户感到自己在“操作工具”，而是像延伸出来的神经触角一样自然流淌。
`
  },
  {
    id: 'sample-journal-1',
    date: getTodayDateString(),
    topicId: 'journal',
    title: '秋日微风与书桌前的沉静时刻',
    mood: '☕',
    rating: 5,
    tags: ['生活琐记', '随想'],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    content: `# 秋日微风记

傍晚推开窗户，秋天带着微凉的气息迎面拂来。天边的晚霞呈现出从紫灰到柔粉的渐变层次。

给桌上的小绿植换了清水，冲了一杯热茶。当水汽蒸腾而起的时候，忽然意识到：

> 慢下来，不是为了停滞，而是为了让灵魂跟上脚步。

### 今日小确幸
1. 梳理完了全年的阅读规划
2. 搭建了一款真正符合心意的时空日历笔记
3. 听了一张老爵士黑胶唱片

*生活本就是由无数个平凡却真切的瞬间拼贴而成的诗篇。*`
  },
  {
    id: 'sample-thought-1',
    date: getTodayDateString(),
    topicId: 'thought',
    title: '知识网络与时间序列的交织维度',
    mood: '✨',
    rating: 4,
    tags: ['卡片笔记', '知识管理'],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    content: `### 为什么日历是天然的思考容器？

传统笔记软件有两种极端：
- **纯树状目录**：层级过深，分类焦虑严重。
- **纯网状双链**：容易迷失在节点迷宫中，缺少时间轴的生命感。

而**时间**是宇宙唯一的单向坐标。通过将**时间（12个月日历）**作为第一宿主，并在单日内支持**多主题卡片流**，既保留了时间的锚定感，又赋予了自由发散的思考空间。`
  }
];
