import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { Conversation, Message } from '../types';
import { useAuth } from '../context/AuthContext';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvId = searchParams.get('conv');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirection si visiteur
  useEffect(() => {
    if (!user) {
      navigate('/auth?tab=login');
    }
  }, [user, navigate]);

  // Polling des conversations (toutes les 5 secondes selon spécification GEMINI.md)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get<Conversation[]>('/conversations');
        setConversations(res.data);

        if (selectedConvId) {
          const current = res.data.find((c) => c.id === Number(selectedConvId));
          if (current) setActiveConversation(current);
        } else if (res.data.length > 0 && !activeConversation) {
          setActiveConversation(res.data[0]);
          setSearchParams({ conv: res.data[0].id.toString() });
        }
      } catch (err) {
        console.error('Erreur chargement conversations', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  // Polling des messages de la conversation active (5 secondes)
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get<Message[]>(`/conversations/${activeConversation.id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('Erreur chargement messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [activeConversation]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const res = await api.post<Message>('/messages', {
        conversation_id: activeConversation.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Erreur envoi message', err);
    } finally {
      setSending(false);
    }
  };

  const getRecipientProfile = (conv: Conversation) => {
    if (!user) return null;
    return conv.parent_id === user.id ? conv.babysitter?.profile : conv.parent?.profile;
  };

  const activeRecipient = activeConversation ? getRecipientProfile(activeConversation) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Messagerie</h1>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh]">
        {/* Colonne Gauche : Liste des Conversations */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Chargement...</div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const recipient = getRecipientProfile(conv);
                const isSelected = activeConversation?.id === conv.id;
                const avatar =
                  recipient?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    recipient ? recipient.first_name + ' ' + recipient.last_name : 'User'
                  )}&background=2563EB&color=fff`;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setSearchParams({ conv: conv.id.toString() });
                    }}
                    className={`w-full p-4 flex items-center gap-3 text-left transition ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {recipient?.first_name} {recipient?.last_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.updated_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {conv.last_message?.content || 'Nouvelle discussion'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aucune conversation active pour le moment.
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Fil de discussion actif */}
        <div
          className={`flex-1 flex flex-col ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Header discussion */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {activeRecipient?.first_name?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">
                        {activeRecipient?.first_name} {activeRecipient?.last_name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {activeRecipient?.city || 'Utilisateur'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-2xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Démarrez la conversation dès maintenant...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
              <MessageSquare size={48} className="mb-3 text-slate-300" />
              <p className="text-base font-semibold text-slate-600">Sélectionnez une conversation</p>
              <p className="text-xs text-slate-400 mt-1">
                Choisissez un fil de discussion à gauche pour échanger en direct
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

