import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocation } from 'react-router-dom';
import { Send, UserCheck, MessageSquare, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AccountManagerChat() {
  const { user, profile } = useAuthStore();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const chatEndRef = useRef(null);

  // Hardcoded Admin ID representing Biggo Admin
  const ADMIN_ID = 'f54c972d-b568-4dde-84c9-99dfe21b9384';

  const managerName = profile?.manager_name || 'BiggoHomes';
  const managerAvatar = profile?.manager_avatar;
  const managerInitials = managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Fetch messages strictly between logged-in user and the Admin
  const fetchChatDetails = async () => {
    if (!user) return;

    try {
      const { data: history, error } = await supabase
        .from('messages')
        .select('*')
        .eq('status', 'active')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
      } else if (history) {
        setMessages(history);
      }
    } catch (err) {
      console.error('Failed to fetch chat details:', err);
    }
  };

  useEffect(() => {
    if (!user || location.pathname === '/chat-manager') return;

    let chatChannel = null;

    const setupChat = async () => {
      await fetchChatDetails();

      chatChannel = supabase
        .channel(`user_chat_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (
              payload.new.status === 'active' &&
              ((payload.new.sender_id === user.id && payload.new.receiver_id === ADMIN_ID) ||
               (payload.new.sender_id === ADMIN_ID && payload.new.receiver_id === user.id))
            ) {
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            }
          }
        )
        .subscribe();
    };

    setupChat();

    return () => {
      if (chatChannel) supabase.removeChannel(chatChannel);
    };
  }, [user, location.pathname]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchChatDetails();
    setRefreshing(false);
    toast.success('Chat refreshed successfully!', { autoClose: 1500, hideProgressBar: true });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage;
    setNewMessage('');

    // Force receiver_id to ALWAYS be the admin ID
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      content: msgText,
      status: 'active',
    });

    if (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message.');
    } else {
      fetchChatDetails();
    }
  };

  if (location.pathname === '/chat-manager') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 border border-amber-500/30"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-bold">Talk to Account Manager</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          
          <div className="p-4 bg-[#0B1F4B] text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {managerAvatar ? (
                  <img src={managerAvatar} alt={managerName} className="w-10 h-10 rounded-xl object-cover border border-amber-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0B1F4B] font-extrabold flex items-center justify-center text-sm">
                    {managerInitials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0B1F4B] rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{managerName}</h4>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Account Manager</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button onClick={handleManualRefresh} disabled={refreshing} title="Refresh Messages" className="text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-[#071326]/50">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-amber-500 opacity-60" />
                <p>You are connected with {managerName}.</p>
                <p className="mt-1">Send a message below to start chatting!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      isMe ? 'bg-[#D9A52E] text-[#0B1F4B] rounded-br-none shadow-md' : 'bg-white dark:bg-[#10213B] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#0B1F4B] border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${managerName}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
            <button type="submit" className="p-2.5 rounded-xl bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] hover:opacity-90 transition shadow-md">
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}