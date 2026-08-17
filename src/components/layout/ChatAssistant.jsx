import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { chatbotService } from '../../services/chatbotService';
import { eventService } from '../../services/eventService';
import { cartService } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';
import { MessageSquare, Sparkles, Send, X, Bot, Trash2, ShoppingBag, ExternalLink, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_GREETING = {
  role: 'assistant',
  content: 'Xin chào! Tôi là trợ lý AI mua sắm của Nivora. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn kiểu dáng, so sánh giá cả hoặc chính sách bảo hành. Bạn cần tư vấn thông tin gì hôm nay ạ?',
  suggestedProducts: [],
  isGreeting: true
};

const ChatAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { text: 'Tìm áo thun nam cao cấp', tracking: 'quick_prompt_shirt' },
    { text: 'Bàn làm việc gỗ dưới 2 triệu', tracking: 'quick_prompt_desk' },
    { text: 'So sánh ghế xoay và ghế chân quỳ', tracking: 'quick_prompt_chair' },
    { text: 'Chính sách đổi trả & giao hàng', tracking: 'quick_prompt_policy' },
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

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    const prodId = product.id || product.product_id;
    if (!prodId) return;

    setAddingProductId(prodId);
    try {
      await cartService.addToCart(prodId, 1);
      toast.success(`Đã thêm "${product.name || product.title}" vào giỏ hàng!`);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      toast.error('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!');
    } finally {
      setAddingProductId(null);
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
      const allMsgs = [...messages, newUserMessage];
      const chatHistory = allMsgs
        .filter((m) => !m.isGreeting)
        .map((m) => ({ role: m.role, content: m.content }))
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
          content: 'Xin lỗi, tôi gặp sự cố kết nối tạm thời. Bạn vui lòng thử lại nhé!',
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

  // Markdown parser to rich clean HTML
  const formatMarkdown = (text) => {
    if (!text) return '';

    let html = text.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown headings ### Heading -> <h4>
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-emerald-850 text-sm mt-1 mb-0.5">$1</h4>');

    // Bold numbered titles e.g. "1. Khứ Linh Thám" or "**1. Khứ Linh Thám**"
    html = html.replace(/^(?:\*\*)?(\d+\.\s+[^\n]+)(?:\*\*)?$/gim, '<h4 class="font-bold text-emerald-850 text-sm mt-1 mb-0.5">$1</h4>');

    // Markdown tables parsing
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

    // Bold text **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');

    // Bullet points
    const processedLinesList = [];
    let inList = false;
    const listLines = html.split('\n');
    for (let i = 0; i < listLines.length; i++) {
      const line = listLines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          processedLinesList.push('<ul class="list-disc pl-4 my-1 space-y-0.5 text-gray-700">');
        }
        const itemContent = trimmed.substring(2);
        processedLinesList.push(`<li>${itemContent}</li>`);
      } else {
        if (inList) {
          processedLinesList.push('</ul>');
          inList = false;
        }
        if (trimmed) {
          processedLinesList.push(line);
        }
      }
    }
    if (inList) {
      processedLinesList.push('</ul>');
    }

    html = processedLinesList.join('\n');

    // Collapse multiple empty line breaks into single breaks
    html = html.replace(/\n\s*\n+/g, '\n');
    html = html.replace(/\n/g, '<br />');

    return `<div>${html}</div>`;
  };

  const renderHtmlTable = (rows) => {
    if (rows.length < 2) return rows.join('\n');

    const headers = rows[0]
      .split('|')
      .slice(1, -1)
      .map((h) => h.trim());

    const isSeparator = rows[1].replace(/[:|\-\s]/g, '').length === 0;

    let startIdx = 1;
    if (isSeparator) {
      startIdx = 2;
    }

    const bodyRows = rows.slice(startIdx).map((row) => {
      return row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
    });

    let tableHtml = '<div class="overflow-x-auto custom-scrollbar my-1.5 rounded-xl border border-emerald-100 shadow-xs"><table class="min-w-full text-xs text-left text-gray-800">';
    tableHtml += '<thead class="bg-emerald-50 text-emerald-900 font-bold uppercase border-b border-emerald-100"><tr>';
    headers.forEach((h) => {
      tableHtml += `<th class="px-3 py-1.5 font-bold">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody className="divide-y divide-gray-100">';

    bodyRows.forEach((row, idx) => {
      tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">`;
      row.forEach((cell) => {
        tableHtml += `<td class="px-3 py-1.5 font-medium">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  };

  // Helper component to render single product card inline
  const renderSingleProductCard = (prod, pIdx) => {
    const pId = prod.id || prod.product_id;
    const pName = typeof prod.name === 'string' ? prod.name : (typeof prod.title === 'string' ? prod.title : 'Sản phẩm Nivora');
    const pPrice = typeof prod.price === 'number' ? prod.price : (typeof prod.basePrice === 'number' ? prod.basePrice : 0);
    const pImg = typeof prod.imageUrl === 'string' ? prod.imageUrl : (typeof prod.image_url === 'string' ? prod.image_url : 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80');
    const catName = typeof prod.category === 'object' && prod.category !== null 
      ? (prod.category.name || prod.category.title || '') 
      : (typeof prod.category === 'string' ? prod.category : '');

    return (
      <div
        key={pIdx || pId}
        className="mt-1.5 mb-2 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-2.5 flex gap-2.5 items-center shadow-xs hover:shadow-md transition-all group"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-emerald-100 shrink-0">
          <img
            src={pImg}
            alt={pName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {catName && (
            <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[8px] font-bold px-1 py-0.2 rounded">
              {catName}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {pName}
          </h4>
          <p className="text-xs font-extrabold text-emerald-700 font-mono">
            {formatPrice(pPrice)}
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <Link
              to={`/products/${pId}`}
              onClick={() => toggleChat()}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              Xem chi tiết <ExternalLink size={11} />
            </Link>

            <button
              onClick={(e) => handleAddToCart(prod, e)}
              disabled={addingProductId === pId}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag size={11} /> Thêm giỏ
            </button>
          </div>
        </div>
      </div>
    );
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
            className="absolute right-16 top-1/2 -translate-y-1/2 mr-2 bg-emerald-900 border border-emerald-700/50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            Trợ lý AI tư vấn Nivora
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Pulse */}
      {!isOpen && (
        <span className="absolute -inset-1 rounded-full bg-emerald-500/25 blur-md animate-pulse pointer-events-none"></span>
      )}

      {/* Chat Bubble Toggle Button */}
      {!isOpen && (
        <motion.button
          onClick={toggleChat}
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl shadow-emerald-600/30 border border-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" strokeWidth={2.2} />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-bounce" />
          </div>
        </motion.button>
      )}

      {/* Chat Panel Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[500px] sm:h-[640px] rounded-none sm:rounded-[26px] flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl z-50 text-gray-800"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 border-b border-emerald-500/30 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center relative shadow-inner">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-700"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                    NIVORA AI SHOPPING ASSISTANT
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-emerald-100 font-medium">Tư vấn thông minh & Tìm kiếm sản phẩm 24/7</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={() => setMessages([INITIAL_GREETING])}
                    title="Xóa lịch sử cuộc trò chuyện"
                    className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleChat}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar bg-slate-50/60">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[94%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Message Bubble Container */}
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 border-emerald-500 text-white rounded-tr-none shadow-emerald-600/10 font-medium'
                            : 'bg-white border-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div>{msg.content}</div>
                        ) : (
                          (() => {
                            // Split AI content into product sections by Markdown headers / numbered headings
                            const content = msg.content || '';
                            const sections = content.split(/(?=\n### |\n\d+\.\s|\n\*\*\d+\.\*\*)/g);
                            
                            const placedProductIds = new Set();
                            const renderedElements = [];

                            sections.forEach((section, sIdx) => {
                              if (!section.trim()) return;

                              // Find which suggested product corresponds to this text section
                              let matchedProduct = null;
                              if (msg.suggestedProducts && msg.suggestedProducts.length > 0) {
                                // Check 1: Title substring match
                                for (const prod of msg.suggestedProducts) {
                                  const pId = prod.id || prod.product_id;
                                  if (placedProductIds.has(pId)) continue;

                                  const pName = (prod.name || prod.title || '').toLowerCase();
                                  const shortName = pName.split(' - ')[0].split(' (')[0].split(' | ')[0].trim();
                                  const cleanShort = shortName.replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, '').trim();
                                  const cleanSection = section.toLowerCase().replace(/[^a-z0-9àáảãạăằắẳẵẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, '');

                                  if (cleanShort.length > 3 && cleanSection.includes(cleanShort)) {
                                    matchedProduct = prod;
                                    placedProductIds.add(pId);
                                    break;
                                  }
                                }

                                // Check 2: Numbered section index match (e.g. "### 1." -> index 0)
                                if (!matchedProduct) {
                                  const numMatch = section.match(/(?:###|\*\*|\n|^)\s*(\d+)\.\s/);
                                  if (numMatch) {
                                    const targetIndex = parseInt(numMatch[1], 10) - 1;
                                    if (targetIndex >= 0 && targetIndex < msg.suggestedProducts.length) {
                                      const candidate = msg.suggestedProducts[targetIndex];
                                      const candId = candidate.id || candidate.product_id;
                                      if (!placedProductIds.has(candId)) {
                                        matchedProduct = candidate;
                                        placedProductIds.add(candId);
                                      }
                                    }
                                  }
                                }
                              }

                              renderedElements.push(
                                <div key={sIdx} className="mb-2 last:mb-0">
                                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(section) }} />

                                  {/* Render matching product card IMMEDIATELY beneath its section description */}
                                  {matchedProduct && renderSingleProductCard(matchedProduct, sIdx)}
                                </div>
                              );
                            });

                            // Render leftover products if any were not matched inline
                            const leftoverProducts = (msg.suggestedProducts || []).filter(
                              (p) => !placedProductIds.has(p.id || p.product_id)
                            );

                            return (
                              <>
                                {renderedElements}
                                {leftoverProducts.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-emerald-100">
                                    {leftoverProducts.map((p, idx) => renderSingleProductCard(p, `leftover-${idx}`))}
                                  </div>
                                )}
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      <span className="text-xs text-gray-500 font-medium ml-1">AI đang phân tích & tổng hợp thông tin...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Suggestions Area */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2.5 bg-white border-t border-gray-100 shrink-0">
                <p className="text-[11px] text-gray-500 font-bold mb-1.5 uppercase tracking-wide">💡 GỢI Ý CÂU HỎI NHANH:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.text)}
                      className="text-left px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 font-medium transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate">{p.text}</span>
                      <ArrowRight size={12} className="text-gray-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Footer */}
            <div className="p-3.5 bg-white border-t border-gray-200 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập câu hỏi tư vấn hoặc tìm kiếm sản phẩm..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 focus:bg-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-sans"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer shrink-0"
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
