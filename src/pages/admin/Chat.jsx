import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Send, User, MessageSquare, Search, ShieldCheck } from 'lucide-react';

export default function AdminMessagesPage() {
  const { user } = useAuthStore();
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Load all registered investor profiles
  useEffect(() => {
    const fetchInvestors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'investor')
        .order('full_name', { ascending: true });

      if (data) setInvestors(data);
    };
    fetchInvestors();
  }, []);

  // Fetch messages for selected investor & subscribe to realtime
  useEffect(() => {
    if (!selectedInvestor || !user) return;

    const fetchConversation = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedInvestor.id}),and(sender_id.eq.${selectedInvestor.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchConversation();

    const channel = supabase
      .channel(`admin_chat_${selectedInvestor.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (
            (payload.new.sender_id === selectedInvestor.id && payload.new.receiver_id === user.id) ||
            (payload.new.sender_id === user.id && payload.new.receiver_id === selectedInvestor.id)
          ) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedInvestor, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedInvestor) return;

    const text = newMessage;
    setNewMessage('');

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedInvestor.id,
      content: text,
    });
  };

  const filteredInvestors = investors.filter(i => 
    i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-[#0B1F4B]/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg flex overflow-hidden">
      
      {/* Left Sidebar: Investor List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-[#071326]/40">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm mb-3">Investor Concierge</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search investor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredInvestors.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setSelectedInvestor(inv)}
              className={`w-full p-4 text-left flex items-center space-x-3 transition ${
                selectedInvestor?.id === inv.id 
                  ? 'bg-amber-500/10 border-l-4 border-amber-500' 
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#0B1F4B] text-amber-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                {inv.full_name ? inv.full_name.slice(0, 2).toUpperCase() : 'IN'}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold truncate">{inv.full_name || 'Anonymous Investor'}</p>
                <p className="text-[10px] text-slate-500 truncate">{inv.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Pane: Conversation Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1F4B]">
        {selectedInvestor ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0B1F4B] font-extrabold flex items-center justify-center text-sm">
                  {selectedInvestor.full_name ? selectedInvestor.full_name.slice(0, 2).toUpperCase() : 'IN'}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{selectedInvestor.full_name}</h4>
                  <p className="text-[11px] text-slate-500">{selectedInvestor.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Direct Client
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#071326]/30">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] rounded-br-none shadow-md font-semibold' 
                        : 'bg-white dark:bg-[#10213B] border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <input
                type="text"
                placeholder={`Reply to ${selectedInvestor.full_name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-amber-500 text-[#0B1F4B] font-bold text-xs flex items-center space-x-2 shadow-md hover:bg-amber-400 transition"
              >
                <span>Send Reply</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-12 h-12 mb-3 text-amber-500 opacity-50" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Select an Investor</h4>
            <p className="text-xs max-w-xs mt-1">Choose an investor from the left list to view their messages or start a concierge conversation.</p>
          </div>
        )}
      </div>

    </div>
  );
}