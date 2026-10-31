import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Send, UserCheck, MessageSquare, X, ShieldAlert } from 'lucide-react';

export default function AccountManagerChat() {
  const { user, profile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [manager, setManager] = useState(null);
  const chatEndRef = useRef(null);

  // Fetch assigned Account Manager & historical messages
  useEffect(() => {
    if (!user) return;

    const fetchChatDetails = async () => {
      // 1. Fetch manager profile (fallback to default admin if none explicitly assigned)
      const { data: managerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (managerData) setManager(managerData);

      // 2. Fetch past conversation
      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${managerData?.id}),and(sender_id.eq.${managerData?.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (history) setMessages(history);
    };

    fetchChatDetails();

    // 3. Subscribe to Supabase Realtime for instant messaging updates
    const channel = supabase
      .channel('live_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (
            (payload.new.sender_id === user.id && payload.new.receiver_id === manager?.id) ||
            (payload.new.sender_id === manager?.id && payload.new.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, manager?.id]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

 const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !manager || !user) return;

    const msgText = newMessage;
    setNewMessage('');

    // 1. Optimistically append message to local state immediately
    const tempMessage = {
      id: Date.now().toString(), // temporary unique ID
      sender_id: user.id,
      receiver_id: manager.id,
      content: msgText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    // 2. Insert into Supabase database
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: manager.id,
      content: msgText,
    });

    if (error) {
      console.error('Failed to send message:', error);
      // Optional: remove temp message or show error toast if it fails
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 border border-amber-500/30"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-bold">Talk to Account Manager</span>
        </button>
      )}

      {/* Floating Chat Box Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="p-4 bg-[#0B1F4B] text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0B1F4B] font-extrabold flex items-center justify-center text-sm">
                  {manager?.full_name ? manager.full_name.slice(0, 2).toUpperCase() : 'AM'}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0B1F4B] rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{manager?.full_name || 'Dedicated Concierge'}</h4>
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Account Manager</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-[#071326]/50">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-amber-500 opacity-60" />
                <p>You are connected with your designated Account Manager.</p>
                <p className="mt-1">Send a message below to start chatting!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        isMe
                          ? 'bg-[#D9A52E] text-[#0B1F4B] rounded-br-none shadow-md'
                          : 'bg-white dark:bg-[#10213B] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#0B1F4B] border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a question about your portfolio..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] hover:opacity-90 transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}