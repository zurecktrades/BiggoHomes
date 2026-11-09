import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Send, Loader2, Sparkles, 
  Archive, CheckCheck, AlertTriangle, X, 
  Trash2, RefreshCw, MessageSquare, Settings, Upload, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AccountManagerPage() {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const chatEndRef = useRef(null);

  // Hardcoded Admin ID representing Biggo Admin
  const ADMIN_ID = 'f54c972d-b568-4dde-84c9-99dfe21b9384';

  // Manager details derived from profile fallback
  const managerName = profile?.manager_name || 'BiggoHomes Concierge';
  const managerAvatar = profile?.manager_avatar;
  const managerInitials = managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!user) return;
    fetchChatData();
  }, [user]);

  const fetchChatData = async () => {
    setLoading(true);
    try {
      // Fetch only ACTIVE messages strictly between the user and the fixed Admin ID
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
      console.error('Failed to fetch chat data:', err);
    }
    setLoading(false);
  };

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchChatData();
    setRefreshing(false);
    toast.success("Chat history refreshed!", { autoClose: 1500, hideProgressBar: true });
  };

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dedicated_chat_${user.id}`)
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
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e, text = newMessage) => {
    if (e) e.preventDefault();
    const msgText = text.trim();
    if (!msgText || !user) return;

    setSending(true);
    // Force receiver_id to ALWAYS be the admin ID
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      content: msgText,
      status: 'active',
    });

    if (error) {
      toast.error('Failed to send message.');
    } else {
      setNewMessage('');
      fetchChatData(); // Fallback sync
    }
    setSending(false);
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(null, promptText);
  };

  // End/Archive session -> saves to JSONB and updates active messages status to 'archived'
  const handleConfirmEndSession = async () => {
    setArchiving(true);
    try {
      // 1. Save JSONB snapshot in chat_sessions
      const { error: archiveError } = await supabase.from('chat_sessions').insert({
        user_id: user.id,
        admin_id: ADMIN_ID,
        session_title: `Support Chat - ${new Date().toLocaleDateString()}`,
        messages_snapshot: messages,
        status: 'archived',
      });

      if (archiveError) throw archiveError;

      // 2. Mark active messages as archived so they don't fetch anymore on refresh
      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'archived' })
        .eq('status', 'active')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${user.id})`);

      if (updateError) throw updateError;

      setMessages([]);
      setShowEndChatModal(false);
      toast.success("Chat session ended successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Unable to end chat session.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12 max-w-8xl p-4 mx-auto">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Support</h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>Refresh Chat</span>
          </button>

          {/* Start New Chat / Archive Button */}
          <button
            onClick={() => setShowEndChatModal(true)}
            disabled={archiving || messages.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-red-500/10 hover:bg-amber-500/20 text-red-500 border border-red-500/30 text-xs font-bold transition disabled:opacity-40"
          >
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>End Chat Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Assigned Manager Profile Card */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between h-fit">
          <div className="space-y-6 flex justify-between md:flex-col md:gap-6">
            
            <div className="text-center space-y-3">
              <div className="relative w-10 h-10 mx-auto rounded-3xl bg-gradient-to-tr from-[#0B1F4B] via-slate-800 to-[#D9A52E] p-1 shadow-xl">
                {managerAvatar ? (
                  <img src={managerAvatar} alt={managerName} className="w-full h-full rounded-[22px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-[#071326] flex items-center justify-center text-amber-400 font-sans font-bold text-2xl">
                    {managerInitials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#0B1F4B] rounded-full" title="Online" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{managerName}</h3>
                <p className="text-xs font-semibold text-amber-500">Account Manager</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Response Time</p>
                <p className="font-sans font-bold text-emerald-500 mt-0.5">&lt; 15 Mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Screen */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden h-[350px] sm:h-[380px] lg:h-[500px]">
          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30 dark:bg-[#071326]/30">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Start a conversation with {managerName}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Select a quick inquiry prompt below or type your message.</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2">
                  <button
                    onClick={() => handleQuickPrompt("Hello, I want to request bank wire escrow instructions for a manual deposit.")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-semibold transition"
                  >
                    💳 Bank Wire Instructions
                  </button>
                  <button
                    onClick={() => handleQuickPrompt("Hi! I need help verifying my recent deposit transaction.")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-semibold transition"
                  >
                    🔍 Verify Deposit
                  </button>
                  <button
                    onClick={() => handleQuickPrompt("I would like to discuss institutional allocation opportunities.")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-semibold transition"
                  >
                    🏢 Large Allocation Deal
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs space-y-1 shadow-sm ${
                      isMe
                        ? 'bg-[#D9A52E] text-[#0B1F4B] font-medium rounded-br-none'
                        : 'bg-white dark:bg-[#10213B] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <div className={`flex items-center justify-end space-x-1 text-[9px] ${isMe ? 'text-[#0B1F4B]/70' : 'text-slate-400'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#071326]/50 flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${managerName}...`}
              className="flex-1 px-4 py-3 text-base sm:text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1F4B] focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-5 py-3 rounded-2xl bg-amber-500 text-[#0B1F4B] font-sans font-bold text-xs shadow-md hover:bg-amber-400 transition flex items-center space-x-1.5 disabled:opacity-50 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* End Chat Session Confirmation Modal */}
      {showEndChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <button
              onClick={() => setShowEndChatModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">End Chat Session?</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to end this chat session? 
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndChatModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmEndSession}
                disabled={archiving}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-sans font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                {archiving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}