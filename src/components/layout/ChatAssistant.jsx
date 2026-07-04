import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { chatbotService } from '../../services/chatbotService';
import { eventService } from '../../services/eventService';
import { formatPrice } from '../../utils/formatPrice';
import { MessageSquare, Sparkles, Send, X, Bot, Trash2 } from 'lucide-react';

const INITIAL_GREETING = {
  role: 'assistant',
  content: 'Xin chào! Tôi là trợ lý mua sắm của Nivora. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể yêu cầu tôi tìm kiếm sản phẩm, tư vấn kích thước hoặc so sánh các sản phẩm nhé!',
  suggestedProducts: [],
  isGreeting: true
};

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { text: 'So sánh ghế xoay và ghế gỗ', tracking: 'quick_prompt_compare' },
    { text: 'Bàn học dưới 2 triệu', tracking: 'quick_prompt_budget' },
    { text: 'Tìm tủ quần áo phòng ngủ', tracking: 'quick_prompt_wardrobe' },
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const toggleChat = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      eventService.track('view_chat').catch(() => {});
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputMessage('');
    }

    const newUserMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    // Track user message event
    eventService.track('chat_message_sent', null, text).catch(() => {});

    try {
      // Build conversation history:
      // - Exclude the initial greeting (isGreeting flag) — it wastes a context slot
      // - Keep up to the last 12 real messages (6 full user↔AI turns = 6 conversations)
      const allMsgs = [...messages, newUserMessage];
      const chatHistory = allMsgs
        .filter(m => !m.isGreeting)
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-12);

      const response = await chatbotService.sendChatMessage(chatHistory);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
          suggestedProducts: response.suggestedProducts || []
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, tôi gặp sự cố kết nối với máy chủ hỗ trợ. Bạn vui lòng thử lại nhé!',
          suggestedProducts: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Helper function to format basic Markdown to HTML
  const formatMarkdown = (text) => {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Tables parsing
    const lines = html.split('\n');
    let inTable = false;
    let tableRows = [];
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      } else {
        if (inTable) {
          const tableHtml = renderHtmlTable(tableRows);
          processedLines.push(tableHtml);
          inTable = false;
        }
        processedLines.push(lines[i]);
      }
    }
    if (inTable) {
      const tableHtml = renderHtmlTable(tableRows);
      processedLines.push(tableHtml);
    }

    html = processedLines.join('\n');

    // 2. Bold text **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // 3. Bullet points: lines starting with "- " or "* " -> list items
    const processedLinesList = [];
    let inList = false;
    const listLines = html.split('\n');
    for (let i = 0; i < listLines.length; i++) {
      const line = listLines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          processedLinesList.push('<ul class="list-disc pl-5 my-2 space-y-1 text-gray-300">');
        }
        const itemContent = trimmed.substring(2);
        processedLinesList.push(`<li>${itemContent}</li>`);
      } else {
        if (inList) {
          processedLinesList.push('</ul>');
          inList = false;
        }
        processedLinesList.push(line);
      }
    }
    if (inList) {
      processedLinesList.push('</ul>');
    }

    html = processedLinesList.join('\n');

    // 4. Double line breaks into paragraphs
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, '<br />');

    return `<p class="mb-2">${html}</p>`;
  };

  const renderHtmlTable = (rows) => {
    if (rows.length < 2) return rows.join('\n');

    const headers = rows[0]
      .split('|')
      .slice(1, -1)
      .map(h => h.trim());

    const isSeparator = rows[1].replace(/[:|\-\s]/g, '').length === 0;

    let startIdx = 1;
    if (isSeparator) {
      startIdx = 2;
    }

    const bodyRows = rows.slice(startIdx).map(row => {
      return row.split('|')
        .slice(1, -1)
        .map(c => c.trim());
    });

    let tableHtml = '<div class="overflow-x-auto custom-scrollbar my-3 rounded-lg border border-gray-700/60"><table class="min-w-full text-xs text-left text-gray-300">';
    tableHtml += '<thead class="bg-gray-800/80 text-white font-bold uppercase border-b border-gray-700/60"><tr>';
    headers.forEach(h => {
      tableHtml += `<th class="px-3 py-2">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    bodyRows.forEach((row, idx) => {
      tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-gray-900/40' : 'bg-gray-900/10'} border-b border-gray-850/60">`;
      row.forEach(cell => {
        tableHtml += `<td class="px-3 py-2 font-medium">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating AI Tooltip Label */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 mr-2 bg-slate-900 border border-slate-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            Trợ Lý AI tư vấn
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glowing background ring */}
      <span className="absolute -inset-1 rounded-full bg-primary/20 blur-sm animate-pulse pointer-events-none"></span>

      {/* Chat Bubble Toggle Button */}
      <motion.button
        onClick={toggleChat}
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white bg-primary hover:bg-primary-hover border border-primary/30 shadow-lg hover:shadow-primary/20 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" strokeWidth={2.5} />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" strokeWidth={2} />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-bounce" />
          </div>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full h-full sm:w-[380px] sm:h-[580px] rounded-none sm:rounded-2xl flex flex-col overflow-hidden bg-slate-950 border-none sm:border sm:border-slate-800 shadow-2xl z-50 text-white"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-primary border-b border-primary-hover/20 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-primary"></span>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide text-white flex items-center gap-1.5">
                    Trợ Lý Mua Sắm AI
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-blue-100 font-medium opacity-90">Tự động trả lời 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={() => setMessages([INITIAL_GREETING])}
                    title="Xoá lịch sử trò chuyện"
                    className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleChat}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed border max-w-full overflow-x-auto ${
                          msg.role === 'user'
                            ? 'bg-primary border-none text-white rounded-tr-none shadow-md'
                            : 'bg-slate-900 border border-slate-800/80 text-gray-150 rounded-tl-none shadow-sm'
                        }`}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                      
                      {/* Suggested Products List */}
                      {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                        <div className="mt-3 py-1">
                          <div className="grid grid-cols-2 gap-2.5">
                            {msg.suggestedProducts.map((prod) => (
                              <div
                                key={prod.id || prod.product_id}
                                className="w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group transition-colors shadow-sm"
                              >
                                <div className="h-24 overflow-hidden bg-slate-950">
                                  <img
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80'}
                                    alt={prod.name || prod.title}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  />
                                </div>
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-[11px] font-normal text-gray-250 line-clamp-2 min-h-[30px] leading-snug">
                                      {prod.name || prod.title}
                                    </h4>
                                    {(prod.recommendationReason || prod.reason) && (
                                      <div className="mt-1 flex items-center gap-1 text-[9px] text-accent font-semibold leading-tight">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                                        <span className="line-clamp-1">{prod.recommendationReason || prod.reason}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2.5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <p className="text-[11px] font-bold text-white">
                                        {formatPrice(prod.price || prod.basePrice || 0)}
                                      </p>
                                      {(prod.recommendationScore || prod.score) > 0 && (
                                        <span className="text-[8px] bg-accent/10 text-accent border border-accent/30 px-1.5 py-0.5 rounded font-mono font-bold w-max">
                                          {Math.round((prod.recommendationScore || prod.score) * 100)}% Match
                                        </span>
                                      )}
                                    </div>
                                    <Link
                                      to={`/products/${prod.id || prod.product_id}`}
                                      onClick={() => toggleChat()}
                                      className="block text-center mt-2 py-1 text-[10px] font-semibold text-gray-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                                    >
                                      Xem chi tiết
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
 
              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
 
            {/* Quick Prompts Area */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-gray-400 mb-1.5 font-medium">Gợi ý câu hỏi:</p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.text)}
                      className="text-left px-3 py-1.5 text-xs rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white transition-all focus:outline-none cursor-pointer"
                    >
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
 
            {/* Chat Input Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-900 flex gap-2 items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi về sản phẩm, giá bán, so sánh..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 text-xs sm:text-sm rounded-xl px-3 py-2 border border-slate-800 text-gray-200 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors shadow-md focus:outline-none active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAssistant;
