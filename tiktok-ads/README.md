# SoulSketch — TikTok 投放素材方案

## 📊 投放策略概览

| 项目 | 详情 |
|------|------|
| 目标 | 测试流量，验证转化漏斗 |
| 预算 | 建议首日 $50-100 测试 |
| 受众 | 18-35岁，兴趣：星座/塔罗/恋爱/命理 |
| 地区 | US / UK / AU 先行测试 |
| 目标事件 | CompletePayment（需要先埋 TikTok Pixel）|
| 素材风格 | 原生感 > 广告感，UGC 风格最佳 |

---

## 🎬 素材方案 A：「星座配对震惊体」（推荐首选）

### Hook（前 3 秒）
**画面**：手机屏幕录制，打开 SoulSketch
**文字叠加**：`POV: You let AI find your soulmate based on your zodiac 👀`
**旁白**：`I let AI figure out who my soulmate is... and I was NOT ready`

### 中段（3-15 秒）
**画面**：快速填写表单（选星座 → 输入名字 → 点击按钮）
**旁白**：`You just pick your zodiac sign, type your name, and hit reveal...`
**画面**：Loading 动画（星星对齐效果）
**旁白**：`The AI literally reads the stars for you...`

### 高潮（15-25 秒）
**画面**：结果页展示（灵魂伴侣名字 + 兼容度分数 + AI 生成的素描肖像）
**旁白**：`It matched me with a Libra named Luna?? 94% compatible?!`
**文字叠加**：`The AI drew what they look like 💀💜`

### CTA（25-30 秒）
**画面**：手指点击屏幕，指向链接
**旁白**：`Link in bio — find yours before Mercury goes retrograde 😭`
**文字叠加**：`🔮 soulsketch.com — FREE to try`

### 音乐建议
- 神秘/宇宙感 BGM（TikTok 搜索 "zodiac audio" 或 "cosmic aesthetic"）
- 避免版权音乐，用 TikTok 音频库

---

## 🎬 素材方案 B：「情侣反应视频」

### Hook（前 3 秒）
**画面**：两人坐在一起，举着手机
**文字叠加**：`We let AI decide if we're actually compatible 💀`

### 中段
**画面**：各自填写信息（故意选不搭的星座，比如白羊 vs 天蝎）
**旁白**：`Okay he's a Scorpio and I'm an Aries so this should be interesting...`
**画面**：Loading → 结果页
**旁白**：`WAIT. 78%?! The AI said we have "intense magnetic energy"`

### 高潮
**画面**：AI 生成的素描肖像
**旁白**：`It literally drew what our soulmate looks like and it kinda looks like him???`
**两人反应**：震惊/笑

### CTA
**文字叠加**：`Try it with YOUR partner → link in bio`

---

## 🎬 素材方案 C：「屏幕录制 POV」

### Hook（前 2 秒）
**画面**：纯黑屏 + 白色打字机文字
`I asked AI who my soulmate is.`
`Based only on my zodiac sign.`

### 中段
**画面**：屏幕录制全流程（不说话，只有 BGM + 字幕）
- 打开网站 → 填写 → 提交
- Loading 动画（加速）
- 结果页缓慢滚动

### 高潮
**画面**：停留在兼容度分数和素描肖像
**字幕**：`The AI literally drew him... I'm scared 😭`

### CTA
**字幕**：`soulsketch.com — your turn`

---

## 📝 文案变体（用于 A/B 测试）

### 标题变体
1. `AI told me who my soulmate is and I'm SHOOK`
2. `This AI draws your soulmate based on your zodiac...`
3. `I asked AI to find my soulmate. Here's what happened.`
4. `POV: AI matches you with your cosmic soulmate ✨`
5. `What if AI could read the stars and find your person?`

### 描述变体
1. `🔮 Free to try → soulsketch.com #zodiac #soulmate #AI`
2. `The AI literally drew what they look like 💜 #astrology #fyp`
3. `I'm never using dating apps again #soulmate #zodiacsigns`

---

## ⚙️ TikTok Pixel 埋点（需在 index.html 添加）

在 `</body>` 前加入：

```html
<!-- TikTok Pixel -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[t+"_u"]=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,
ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");
o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('YOUR_PIXEL_ID');
ttq.page();
</script>
```

在 `trackEvent` 调用处添加 TikTok 事件：
```javascript
// 在 trackEvent 函数中加入：
if (typeof ttq !== 'undefined') {
  if (event === 'subscribe_complete') ttq.track('CompletePayment', { value: 9.99, currency: 'USD' });
  if (event === 'form_submit') ttq.track('SubmitForm');
  if (event === 'subscribe_click') ttq.track('InitiateCheckout');
}
```

---

## 📅 投放节奏建议

| 阶段 | 时间 | 预算 | 目标 |
|------|------|------|------|
| 冷启动 | Day 1-3 | $50/day | 3 个素材各 $15，观察 CTR |
| 优化期 | Day 4-7 | $100/day | 砍掉 CTR<1% 的素材，加预算到表现好的 |
| 放量期 | Day 8-14 | $200-500/day | CPA 可控的话持续放量 |

### 关键指标
- **CTR > 2%**：素材合格
- **CPC < $0.50**：流量成本合理
- **注册转化 > 15%**：落地页合格
- **付费转化 > 3%**：Paywall 设计合格
