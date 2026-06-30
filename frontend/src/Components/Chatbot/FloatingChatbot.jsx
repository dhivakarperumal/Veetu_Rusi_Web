import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { MessageCircle, SendHorizonal, X, Sparkles, Clock3 } from 'lucide-react';
import { StoreContext } from '../../PrivateRouter/StoreContext';

const quickActions = [
  'Where is my order?',
  'Show my cart',
  'Find chicken biryani',
  'Show nearby home chefs',
  'Help with coupons',
  'Need customer support'
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

  // access cart helpers from StoreContext
  const { addToCart, addToFoodCart } = useContext(StoreContext);

  const fetchChefProducts = async (chef) => {
    if (!chef) return;
    const chefId = chef.user_id || chef.id;
    const loadingMsg = {
      id: Date.now() + 3,
      role: 'assistant',
      text: `Loading products for ${chef.name || 'chef'}...`,
      time: new Date(),
      data: [],
      resultType: 'chef_products'
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const [pRes, fRes] = await Promise.allSettled([
        api.get(`/products/user/${chefId}`),
        api.get('/chef-foods', { params: { chef_user_id: chefId } })
      ]);

      const products = (pRes.status === 'fulfilled' && Array.isArray(pRes.value.data) ? pRes.value.data : []).map(p => ({ ...p, source: 'chef_products' }));
      const foods = (fRes.status === 'fulfilled' && Array.isArray(fRes.value.data) ? fRes.value.data : []).map(f => ({ ...f, source: 'chef_food_table' }));

      const combined = [...products, ...foods].slice(0, 30);

      const resultMessage = {
        id: Date.now() + 4,
        role: 'assistant',
        text: `Showing ${combined.length} item(s) from ${chef.name || 'this chef'}.`,
        time: new Date(),
        data: combined,
        resultType: 'chef_products'
      };

      setMessages((prev) => [...prev.filter(m => m.id !== loadingMsg.id), resultMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: Date.now() + 5, role: 'assistant', text: 'Failed to load chef products.', time: new Date() }]);
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
                  {message.resultType === 'nearby' && message.data?.length > 0 && (
                    <div className="chatbot-results">
                      {message.data.slice(0, 6).map((chef) => (
                        <button key={`${message.id}-chef-${chef.id || chef.email || chef.phone}`} className="chatbot-result-card" onClick={() => fetchChefProducts(chef)}>
                          <div className="chatbot-result-title">{chef.name}</div>
                          <div className="chatbot-result-meta">{chef.city || chef.district}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {message.resultType === 'chef_products' && message.data?.length > 0 && (
                    <div className="chatbot-results">
                      {message.data.slice(0, 8).map((item) => {
                        const isFood = item.source === 'chef_food_table' || item.product_type === 'Food' || item.product_type === 'Food Product';
                        const itemId = item.product_id || item.id;
                        return (
                          <div key={`${message.id}-prod-${itemId || Math.random()}`} className="chatbot-result-card">
                            <div className="chatbot-result-title">{item.name || item.food_name || item.product_name || 'Item'}</div>
                            <div className="chatbot-result-meta">₹{Number(item.final_price || item.price || item.mrp || 0).toFixed(2)}</div>
                            <div className="chatbot-action-row">
                              <button onClick={() => {
                                if (isFood) addToFoodCart(item, null, null, 1);
                                else addToCart(item, null, null, 1);
                              }}>Add to cart</button>
                              <button onClick={() => navigate(item.source === 'chef_products' ? `/products/${itemId}` : `/chef-foods/${itemId}`)}>View</button>
                            </div>
                          </div>
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
                  {message.resultType === 'support' && message.data?.length > 0 && (
                    <div className="chatbot-results">
                      {message.data.map((item) => (
                        <div key={`${message.id}-${item.title}`} className="chatbot-result-card">
                          <div className="chatbot-result-title">{item.title}</div>
                          <div className="chatbot-result-meta">{item.description}</div>
                          <div className="chatbot-support-contact mt-3 text-sm text-slate-700">
                            <div>
                              Email: <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>
                            </div>
                            <div>
                              Phone: <a href={`tel:${item.phone.replace(/\s+/g, '')}`} className="text-blue-600 hover:underline">{item.phone}</a>
                            </div>
                          </div>
                        </div>
                      ))}
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
