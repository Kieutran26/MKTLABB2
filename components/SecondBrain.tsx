import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, Database } from 'lucide-react';
import { querySecondBrain } from '../services/geminiService';
import { BrainMessage, KnowledgeFile } from '../types';
import { StorageService } from '../services/storageService';
import DocumentManager from './SecondBrain/DocumentManager';
import MessageDisplay from './SecondBrain/MessageDisplay';

const SecondBrain: React.FC = () => {
    const [messages, setMessages] = useState<BrainMessage[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeFile[]>([]);
    const [showDocManager, setShowDocManager] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        setKnowledgeBase(StorageService.getKnowledgeFiles());
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const question = input;
        setInput('');
        setIsProcessing(true);

        // Add User Message
        const userMsg: BrainMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: Date.now()
        };
        
        // Add Placeholder Assistant Message
        const botMsgId = (Date.now() + 1).toString();
        const botMsg: BrainMessage = {
            id: botMsgId,
            role: 'assistant',
            streams: {
                local: { status: 'loading', content: '' },
                web: { status: 'loading', content: '' },
                synthesis: { status: 'loading', content: '' }
            },
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg, botMsg]);

        // Construct Context
        const context = knowledgeBase.map(doc => `[Nguồn: ${doc.name}]\n${doc.content}`).join("\n\n").substring(0, 100000); 

        try {
            const result = await querySecondBrain(question, context);
            
            setMessages(prev => prev.map(msg => {
                if (msg.id === botMsgId) {
                    return {
                        ...msg,
                        streams: {
                            local: { status: 'done', content: result.local },
                            web: { status: 'done', content: result.web },
                            synthesis: { status: 'done', content: result.synthesis }
                        }
                    };
                }
                return msg;
            }));
        } catch (e) {
            setMessages(prev => prev.map(msg => {
                if (msg.id === botMsgId) {
                    return {
                        ...msg,
                        streams: {
                            local: { status: 'error', content: 'Lỗi' },
                            web: { status: 'error', content: 'Lỗi' },
                            synthesis: { status: 'error', content: 'Lỗi' }
                        }
                    };
                }
                return msg;
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                        <Brain size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Second Brain</h2>
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowDocManager(true)}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all text-sm"
                >
                    <Database size={16} /> 
                    Knowledge Base 
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-xs ml-1">{knowledgeBase.length}</span>
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-5xl mx-auto min-h-full flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-20">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                                <Brain size={48} strokeWidth={0.5} className="text-indigo-400"/>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-700 mb-2">Hỏi tôi bất cứ điều gì</h3>
                            <p className="text-slate-500 max-w-md text-center leading-relaxed">
                                Tôi sẽ tìm kiếm câu trả lời trong <span className="font-bold text-indigo-600">tài liệu của bạn</span> và đối chiếu với <span className="font-bold text-blue-500">kiến thức internet</span> để đưa ra câu trả lời toàn diện nhất.
                            </p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <MessageDisplay key={msg.id} message={msg} />
                        ))
                    )}
                    <div ref={chatEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto relative flex items-center">
                    <input 
                        className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner text-slate-800 placeholder:text-slate-400"
                        placeholder="Đặt câu hỏi cho Second Brain..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isProcessing}
                        autoFocus
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isProcessing || !input.trim()}
                        className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
                    </button>
                </div>
                <p className="text-center text-xs text-slate-300 mt-3 font-medium">
                    Powered by Gemini 1.5 Pro (3-Stream Architecture)
                </p>
            </div>

            {/* Document Manager Modal */}
            <DocumentManager 
                isOpen={showDocManager} 
                onClose={() => setShowDocManager(false)}
                onFilesUpdated={setKnowledgeBase}
            />
        </div>
    );
};

export default SecondBrain;