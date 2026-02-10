import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Activity, 
  Shield, 
  Target, 
  Move, 
  Flag, 
  Scale, 
  TrendingUp, 
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  X,
  Send,
  Bot
} from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const SYSTEM_PROMPT_TEXT = "你是一个专业的足球数据分析AI助手，名为“北京有料大叔AI”。分析逻辑需包含xG、xGA等量化指标。如果是分析比赛，请务必在回复的最后包含对应的JSON数据块。";

const DATA_MODEL = [
  { id: 'attack', title: '一、进攻端指标', weight: '30%', icon: <Target className="w-5 h-5" />, color: 'text-red-600', indicators: [{ name: 'xG (期望进球)', weight: 0.08, desc: '官方/专业平台直接取值' }, { name: 'xA (助攻期望)', weight: 0.05, desc: '反映传球创造进球能力' }, { name: '射门转化率', weight: 0.04, desc: '进球数÷总射门数' }, { name: '有效传中数', weight: 0.03, desc: '传中至禁区形成接球' }, { name: '创造绝对机会', weight: 0.03, desc: '单刀/空门次数' }, { name: '进攻三区触球', weight: 0.03, desc: '对方半场前30米触球' }, { name: '反击进球率', weight: 0.02, desc: '反击进球÷反击次数' }, { name: '定位球成功率', weight: 0.02, desc: '定位球进球÷次数' }] },
  { id: 'defense', title: '二、防守端指标', weight: '30%', icon: <Shield className="w-5 h-5" />, color: 'text-blue-600', indicators: [{ name: 'xGA (期望失球)', weight: 0.08, desc: '反映实际防守漏洞' }, { name: '对抗成功率', weight: 0.05, desc: '空中+地面总对抗' }, { name: '有效解围数', weight: 0.04, desc: '解围未被二次进攻' }, { name: '封堵射门数', weight: 0.03, desc: '阻挡对方射门次数' }, { name: '防线紧凑度', weight: 0.03, desc: '后防线平均间距' }, { name: '门将扑救率', weight: 0.03, desc: '扑救数÷射正数' }, { name: '造越位数', weight: 0.02, desc: '让对方越位次数' }, { name: '拦截传球数', weight: 0.02, desc: '断传球且控球' }] },
  { id: 'possession', title: '三、控球与传球', weight: '15%', icon: <Move className="w-5 h-5" />, color: 'text-green-600', indicators: [{ name: '进攻三区控球', weight: 0.04, desc: '关键区域控球占比' }, { name: '向前传球率', weight: 0.03, desc: '向前传球成功率' }, { name: '直塞球成功率', weight: 0.03, desc: '直塞球到位率' }, { name: '持球失误数', weight: 0.03, desc: '控球被断次数', isNegative: true }, { name: '长传成功率', weight: 0.02, desc: '30米以上传球' }] },
  { id: 'status', title: '四、球员状态', weight: '10%', icon: <Activity className="w-5 h-5" />, color: 'text-orange-500', indicators: [{ name: '阵容完整度', weight: 0.04, desc: '主力出场占比' }, { name: '场均评分', weight: 0.03, desc: '近5场均分' }, { name: '体能储备值', weight: 0.03, desc: '跑动距离占比' }] },
  { id: 'tactics', title: '五、战术与跑动', weight: '5%', icon: <Zap className="w-5 h-5" />, color: 'text-yellow-600', indicators: [{ name: '场均跑动', weight: 0.02, desc: '全队总跑动距离' }, { name: '冲刺次数', weight: 0.02, desc: '高速跑动次数' }, { name: '攻防转换速', weight: 0.01, desc: '转换平均时间' }] },
  { id: 'intent', title: '六、赛事战意', weight: '5%', icon: <Trophy className="w-5 h-5" />, color: 'text-purple-600', indicators: [{ name: '晋级权重', weight: 0.02, desc: '赛事阶段关键程度' }, { name: '主客场优势', weight: 0.02, desc: '主场系数修正' }, { name: '赛程密集度', weight: 0.01, desc: '场次密集修正' }] },
  { id: 'env', title: '七、裁判与环境', weight: '3%', icon: <Flag className="w-5 h-5" />, color: 'text-gray-600', indicators: [{ name: '判罚尺度', weight: 0.01, desc: '裁判出牌率' }, { name: '定位球吹罚', weight: 0.01, desc: '吹罚倾向' }, { name: '场地适配', weight: 0.01, desc: '草皮适配度' }] },
  { id: 'odds', title: '八、机构指数', weight: '2%', icon: <TrendingUp className="w-5 h-5" />, color: 'text-teal-600', indicators: [{ name: '欧指均值', weight: 0.008, desc: '即时赔率均值' }, { name: '亚指水位', weight: 0.007, desc: '水位变动' }, { name: '分歧度', weight: 0.005, desc: '机构分歧程度' }] }
];

export default function App() {
  const apiKey = "AIzaSyDpi-Zi7_61RQkV9fe8k1IWY_zaSTsTp1M";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('attack');
  const [teams, setTeams] = useState({ home: { name: '北京国安' }, away: { name: '上海申花' } });
  const [aiPredictionText, setAiPredictionText] = useState("正在初始化 AI 分析模型...");
  const [totalScores, setTotalScores] = useState({ home: 0, away: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: '你好！我是“北京有料大叔AI”。输入“分析 曼城 vs 利物浦”开始预测。' }]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatOpen]);
  useEffect(() => { generateMockData(); }, []);

  const generateMockData = (aiData = null) => {
    setLoading(true);
    setTimeout(() => {
      const mock = {};
      let calculatedHomeScore = 0, calculatedAwayScore = 0;
      DATA_MODEL.forEach(category => {
        mock[category.id] = category.indicators.map((ind, idx) => {
          const homeValue = aiData?.data?.[category.id]?.[idx] ?? Math.floor(Math.random() * 30) + 60;
          const awayValue = aiData?.data?.[category.id + '_away']?.[idx] ?? Math.floor(Math.random() * 30) + 60;
          calculatedHomeScore += homeValue * ind.weight;
          calculatedAwayScore += awayValue * ind.weight;
          return { ...ind, homeValue, awayValue };
        });
      });
      setData(mock);
      setTotalScores({ home: parseFloat(calculatedHomeScore.toFixed(1)), away: parseFloat(calculatedAwayScore.toFixed(1)) });
      setAiPredictionText(aiData?.prediction ?? "数据分析完毕。");
      setLoading(false);
    }, aiData ? 100 : 800);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userInput }] }], systemInstruction: { parts: [{ text: SYSTEM_PROMPT_TEXT }] } })
      });
      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "响应异常。";
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
      let displayMsg = aiText;
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[1]);
        setTeams({ home: { name: aiData.homeTeam }, away: { name: aiData.awayTeam } });
        generateMockData(aiData);
        displayMsg = aiText.replace(/```json[\s\S]*?```/, "\n⚽ 已更新数据图表。");
      }
      setMessages(prev => [...prev, { role: 'ai', text: displayMsg }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'ai', text: "请求失败，请检查 API Key。" }]); }
    finally { setIsTyping(false); }
  };

  return (
    <div className="min-h-screen bg-[#8B0000] pb-10">
      <header className="bg-[#B22222] border-b-4 border-[#FFD700] py-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-[#FFD700] tracking-widest uppercase">北京有料大叔足球分析</h1>
        <p className="text-[#FFD700]/70 text-xs mt-2 font-bold tracking-widest">REAL-TIME DATA QUANTITATIVE ANALYSIS</p>
      </header>
      <main className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl border-4 border-[#FFD700] p-8 flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="text-2xl font-black mb-4 text-gray-800">{teams.home.name}</div>
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-500 flex items-center justify-center bg-white text-3xl font-bold text-red-600 shadow-inner">{totalScores.home}</div>
          </div>
          <div className="flex flex-col items-center gap-4 py-6 md:py-0">
            <div className="text-4xl font-black text-[#B22222] italic drop-shadow-sm">VS</div>
            <button onClick={() => setChatOpen(true)} className="bg-[#B22222] text-[#FFD700] px-6 py-2 rounded-full font-bold border-2 border-[#FFD700] flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><MessageSquare size={18} /> AI 深度预测</button>
            <div className="text-[10px] font-bold text-[#8B0000] bg-[#FFD700]/20 px-3 py-1 rounded-md border border-[#FFD700]/30">{aiPredictionText}</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-black mb-4 text-gray-800">{teams.away.name}</div>
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 flex items-center justify-center bg-white text-3xl font-bold text-blue-600 shadow-inner">{totalScores.away}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_MODEL.map((cat) => (
            <div key={cat.id} className="bg-[#FFF8E7] rounded-xl border border-[#FFD700]/40 overflow-hidden shadow-sm">
              <div onClick={() => setExpandedSection(expandedSection === cat.id ? null : cat.id)} className="bg-[#FFF0D4] p-4 flex items-center justify-between cursor-pointer active:bg-[#FFE8BC] transition-colors">
                <span className="font-bold flex items-center gap-2 text-gray-700">{cat.icon} {cat.title} <span className="text-[10px] font-normal text-gray-400">({cat.weight})</span></span>
                {expandedSection === cat.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === cat.id && data && (
                <div className="p-4 space-y-5 bg-white/50">
                  {data[cat.id].map((ind, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                        <span className="flex items-center gap-1">{ind.name} <Info size={10} className="text-gray-300" /></span>
                        <span className="font-mono">{ind.homeValue} : {ind.awayValue}</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 ml-auto transition-all duration-500" style={{width: `${ind.homeValue}%`}} />
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${ind.awayValue}%`}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <button onClick={() => setChatOpen(!chatOpen)} className="fixed bottom-6 right-6 bg-[#FFD700] p-4 rounded-full shadow-2xl border-4 border-[#8B0000] z-[100] active:scale-90 transition-transform">{chatOpen ? <X className="text-[#8B0000]" /> : <MessageSquare className="text-[#8B0000]" />}</button>
      {chatOpen && (
        <div className="fixed bottom-24 right-4 w-[92%] md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border-2 border-[#B22222] z-[99] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-[#B22222] p-4 text-[#FFD700] font-bold flex items-center gap-2"><Bot size={20} /> 有料大叔 AI 数据中心</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#B22222] text-white rounded-tr-none shadow-md' : 'bg-white border text-gray-700 rounded-tl-none shadow-sm'}`}>{m.text}</div></div>)}
            {isTyping && <div className="text-[10px] text-gray-400 animate-pulse italic">AI 正在根据八大指标建模中...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t bg-white flex gap-2">
            <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#B22222]/20" placeholder="分析 皇家马德里 vs 拜仁" />
            <button onClick={handleSendMessage} disabled={!userInput.trim() || isTyping} className="bg-[#B22222] text-[#FFD700] p-3 rounded-xl hover:bg-red-800 disabled:opacity-50"><Send size={20} /></button>
          </div>
        </div>
      )}
      <SpeedInsights />
    </div>
  );
}
