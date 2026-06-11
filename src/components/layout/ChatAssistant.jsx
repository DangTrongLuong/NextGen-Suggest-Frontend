import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { chatbotService } from '../../services/chatbotService';
import { eventService } from '../../services/eventService';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý mua sắm của Nivora. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể yêu cầu tôi tìm kiếm sản phẩm, tư vấn kích thước hoặc so sánh các sản phẩm nhé!',
      suggestedProducts: []
    }
  ]);
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
      eventService.trackEvent({
        eventType: 'view_chat',
        properties: { timestamp: new Date().toISOString() }
      }).catch(() => {});
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
    eventService.trackEvent({
      eventType: 'chat_message_sent',
      properties: { messageLength: text.length }
    }).catch(() => {});

    try {
      // Build conversation history (sending max 10 messages)
      const chatHistory = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      })).slice(-10);

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

    let tableHtml = '<div class="overflow-x-auto my-3 rounded-lg border border-gray-700/60"><table class="min-w-full text-xs text-left text-gray-300">';
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
      {/* Chat Bubble Toggle Button */}
      <motion.button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-gray-850 to-gray-700 border border-gray-600 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
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
            className="absolute bottom-18 right-0 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] rounded-xl flex flex-col overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl z-50 text-white"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center relative">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-gray-950"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm tracking-wide text-gray-100">Hỗ trợ khách hàng</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Trực tuyến hỗ trợ tư vấn mua sắm</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
                      <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-750 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                          msg.role === 'user'
                            ? 'bg-gray-800 border-gray-700 text-white rounded-tr-none'
                            : 'bg-gray-850 border-gray-800 text-gray-200 rounded-tl-none'
                        }`}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                      
                      {/* Suggested Products List */}
                      {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                        <div className="mt-3 overflow-x-auto scrollbar-hide py-1">
                          <div className="flex gap-2.5 w-max">
                            {msg.suggestedProducts.map((prod) => (
                              <div
                                key={prod.id || prod.product_id}
                                className="w-36 rounded-lg overflow-hidden bg-gray-850 border border-gray-800 flex flex-col group transition-colors"
                              >
                                <div className="h-24 overflow-hidden bg-gray-900">
                                  <img
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80'}
                                    alt={prod.name || prod.title}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  />
                                </div>
                                <div className="p-2 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-[11px] font-normal text-gray-250 line-clamp-2 min-h-[30px] leading-snug">
                                      {prod.name || prod.title}
                                    </h4>
                                  </div>
                                  <div className="mt-1.5">
                                    <p className="text-[12px] font-semibold text-gray-100">
                                      ${prod.basePrice || prod.price}
                                    </p>
                                    <Link
                                      to={`/products/${prod.id || prod.product_id}`}
                                      onClick={() => toggleChat()}
                                      className="block text-center mt-2 py-1 text-[10px] font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-all"
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
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-750 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="px-3 py-2 bg-gray-850 border border-gray-800 rounded-xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Area */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Tìm kiếm nhanh:</p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.text)}
                      className="text-left px-3 py-1.5 text-xs rounded bg-gray-850 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-all focus:outline-none"
                    >
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Footer */}
            <div className="p-3 bg-gray-950 border-t border-gray-800 flex gap-2 items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi về sản phẩm, giá bán, so sánh..."
                disabled={isLoading}
                className="flex-1 bg-gray-850 text-xs sm:text-sm rounded-lg px-3 py-2 border border-gray-800 text-gray-250 focus:outline-none focus:border-gray-700 disabled:opacity-50 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-8 h-8 rounded-lg bg-gray-850 hover:bg-gray-800 border border-gray-750 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAssistant;
