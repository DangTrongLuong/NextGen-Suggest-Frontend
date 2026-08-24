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

  const formatMarkdown = (text) => {
    if (!text) return '';

    let html = text.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-slate-900 text-xs mt-1 mb-0.5">$1</h4>');
    html = html.replace(/^(?:\*\*)?(\d+\.\s+[^\n]+)(?:\*\*)?$/gim, '<h4 class="font-bold text-slate-900 text-xs mt-1 mb-0.5">$1</h4>');

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
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

    const processedLinesList = [];
    let inList = false;
    const listLines = html.split('\n');
    for (let i = 0; i < listLines.length; i++) {
      const line = listLines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          processedLinesList.push('<ul class="list-disc pl-4 my-1 space-y-0.5 text-slate-700">');
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

    let tableHtml = '<div class="overflow-x-auto custom-scrollbar my-1.5 rounded-lg border border-slate-200"><table class="min-w-full text-xs text-left text-slate-800">';
    tableHtml += '<thead class="bg-slate-100 text-slate-900 font-bold uppercase border-b border-slate-200"><tr>';
    headers.forEach((h) => {
      tableHtml += `<th class="px-2.5 py-1 font-bold">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody className="divide-y divide-slate-100">';

    bodyRows.forEach((row, idx) => {
      tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">`;
      row.forEach((cell) => {
        tableHtml += `<td class="px-2.5 py-1 font-medium">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  };

  const renderSingleProductCard = (prod, pIdx) => {
    const pId = prod.id || prod.product_id;
    const pName = typeof prod.name === 'string' ? prod.name : (typeof prod.title === 'string' ? prod.title : 'Sản phẩm Nivora');
    const pPrice = typeof prod.price === 'number' ? prod.price : (typeof prod.basePrice === 'number' ? prod.basePrice : 0);
    const pImg = typeof prod.imageUrl === 'string' ? prod.imageUrl : (typeof prod.image_url === 'string' ? prod.image_url : 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80');

    return (
      <div
        key={pIdx || pId}
        className="mt-1.5 mb-2 bg-slate-50 border border-slate-200 rounded-xl p-2 flex gap-2.5 items-center shadow-xs hover:border-slate-300 transition-all group"
      >
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
          <img
            src={pImg}
            alt={pName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
            {pName}
          </h4>
          <p className="text-xs font-bold text-slate-900">
            {formatPrice(pPrice)}
          </p>

          <div className="flex items-center gap-1.5 pt-0.5">
            <Link
              to={`/products/${pId}`}
              onClick={() => toggleChat()}
              className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded hover:bg-slate-100 flex items-center gap-1 transition-colors"
            >
              Chi tiết <ExternalLink size={10} />
            </Link>

            <button
              onClick={(e) => handleAddToCart(prod, e)}
              disabled={addingProductId === pId}
              className="px-2 py-0.5 bg-slate-900 text-white text-[11px] font-semibold rounded hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag size={10} /> Thêm giỏ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 mr-2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Trợ lý Nivora
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          onClick={toggleChat}
          className="w-13 h-13 rounded-xl flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 shadow-md border border-slate-700 active:scale-95 transition-all duration-200 cursor-pointer"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <Sparkles className="w-3 h-3 text-emerald-400 absolute -top-1 -right-1" />
          </div>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[460px] sm:h-[600px] rounded-none sm:rounded-2xl flex flex-col overflow-hidden bg-white border border-slate-200 shadow-dropdown z-50 text-slate-800"
          >
            <div className="px-4 py-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-wide text-white flex items-center gap-1">
                    TRỢ LÝ MUA SẮM NIVORA
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Tư vấn mua sắm & tìm kiếm sản phẩm</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={() => setMessages([INITIAL_GREETING])}
                    title="Xóa lịch sử"
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={toggleChat}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar bg-slate-50/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-slate-900 border-slate-800 text-white rounded-tr-none font-medium'
                            : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div>{msg.content}</div>
                        ) : (
                          (() => {
                            const content = msg.content || '';
                            const sections = content.split(/(?=\n### |\n\d+\.\s|\n\*\*\d+\.\*\*)/g);
                            const placedProductIds = new Set();
                            const renderedElements = [];

                            sections.forEach((section, sIdx) => {
                              if (!section.trim()) return;

                              let matchedProduct = null;
                              if (msg.suggestedProducts && msg.suggestedProducts.length > 0) {
                                for (const prod of msg.suggestedProducts) {
                                  const pId = prod.id || prod.product_id;
                                  if (placedProductIds.has(pId)) continue;

                                  const pName = (prod.name || prod.title || '').toLowerCase();
                                  const shortName = pName.split(' - ')[0].split(' (')[0].split(' | ')[0].trim();
                                  const cleanShort = shortName.replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, '').trim();
                                  const cleanSection = section.toLowerCase().replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, '');

                                  if (cleanShort.length > 3 && cleanSection.includes(cleanShort)) {
                                    matchedProduct = prod;
                                    placedProductIds.add(pId);
                                    break;
                                  }
                                }

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
                                <div key={sIdx} className="mb-1.5 last:mb-0">
                                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(section) }} />
                                  {matchedProduct && renderSingleProductCard(matchedProduct, sIdx)}
                                </div>
                              );
                            });

                            const leftoverProducts = (msg.suggestedProducts || []).filter(
                              (p) => !placedProductIds.has(p.id || p.product_id)
                            );

                            return (
                              <>
                                {renderedElements}
                                {leftoverProducts.length > 0 && (
                                  <div className="mt-2 pt-1.5 border-t border-slate-100">
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

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl rounded-tl-none flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      <span className="text-[11px] text-slate-500 font-medium ml-1">AI đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && !isLoading && (
              <div className="px-3.5 py-2 bg-white border-t border-slate-100 shrink-0">
                <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">💡 CÂU HỎI MẪU:</p>
                <div className="grid grid-cols-2 gap-1">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.text)}
                      className="text-left px-2 py-1 text-[11px] rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate">{p.text}</span>
                      <ArrowRight size={10} className="text-slate-400 group-hover:text-slate-900 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 focus:bg-white text-xs rounded-lg px-3 py-2 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors font-sans"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAssistant;
