import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { MessageCircle, SendHorizonal, X, Sparkles, Clock3 } from 'lucide-react';

const quickActions = [
  'Where is my order?',
  'Show my cart',
  'Find chicken biryani',
  'Show nearby home chefs',
  'Show my wallet'
];

function formatTime(date) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function FloatingChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I can help with your orders, cart, coupons, nearby chefs, food search, wallet, and support.',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isLoggedIn = useMemo(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return Boolean(token && token !== 'undefined' && token !== 'null');
  }, [open]);

  const sendMessage = async (messageText) => {
    const text = messageText?.trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', { message: text });
        const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.data?.response || 'I could not process that request right now.',
        time: new Date(),
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        resultType: res.data?.resultType || null
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const fallback = error?.response?.data?.message || 'Please sign in to use the chatbot.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: fallback,
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-shell">
      {!open ? (
        <button className="chatbot-fab" onClick={() => setOpen(true)} aria-label="Open chatbot">
          <MessageCircle size={22} />
        </button>
      ) : (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">Veetu Rusi Assistant</div>
              <div className="chatbot-subtitle">Offline support for your account</div>
            </div>
            <button className="chatbot-icon-btn" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message ${message.role}`}>
                <div className="chatbot-bubble">
                  <div>{message.text}</div>
                  {message.resultType === 'search' && message.data?.length > 0 && (
                    <div className="chatbot-results">
                      {message.data.slice(0, 4).map((item) => {
                        const itemId = item.id || item.product_id;
                        if (!itemId) return null;
                        return (
                          <button
                            key={`${message.id}-${itemId}`}
                            className="chatbot-result-card"
                            onClick={() => navigate(`/products/${itemId}`)}
                          >
                            <div className="chatbot-result-title">{item.name || item.food_name || item.product_name || 'Item'}</div>
                            <div className="chatbot-result-meta">
                              {item.category || item.cuisine || item.source || 'Product'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {message.resultType === 'cart' && message.data?.length > 0 && (
                    <div className="chatbot-results">
                      {message.data.slice(0, 4).map((item) => {
                        return (
                          <div key={`${message.id}-${item.id || item.product_id || item.product_id || Math.random()}`} className="chatbot-cart-card">
                            <div className="chatbot-result-title">{item.name || item.product_name || item.food_name || 'Cart item'}</div>
                            <div className="chatbot-cart-meta">
                              <span>Qty: {item.quantity || 1}</span>
                              <span>Price: ₹{Number(item.price || item.mrp || 0).toFixed(2)}</span>
                            </div>
                            <div className="chatbot-cart-total">Total: ₹{Number(item.total_price != null ? item.total_price : (item.price || item.mrp || 0) * (item.quantity || 1)).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="chatbot-time">
                    <Clock3 size={12} /> {formatTime(message.time)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-bubble typing">
                  <span /> <span /> <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!isLoggedIn && (
            <div className="chatbot-warning">Please sign in to use your personal account details.</div>
          )}

          <div className="chatbot-suggestions">
            {quickActions.map((action) => (
              <button key={action} onClick={() => sendMessage(action)}>
                {action}
              </button>
            ))}
          </div>

          <div className="chatbot-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about your order, cart, food, or support..."
            />
            <button onClick={() => sendMessage(input)} aria-label="Send message">
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingChatbot;
