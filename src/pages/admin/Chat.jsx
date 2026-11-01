import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Send, Search, MessageSquare, Settings, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const showCustomToast = (title, message, type = 'success') => {
  toast(
    <div className="flex items-start space-x-3 py-1">
      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
        type === 'success' ? 'bg-amber-500/10 text-[#D9A52E]' : 'bg-red-500/10 text-red-500'
      }`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-[#0B1F4B] dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{message}</p>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      className: "bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 font-sans",
    }
  );
};

export default function AdminMessagesPage() {
  const { user } = useAuthStore();
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [managerNameInput, setManagerNameInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);

  // Load investors & unread counts
  useEffect(() => {
    const fetchInvestorsAndUnreads = async () => {
      const { data: invData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'investor')
        .order('full_name', { ascending: true });

      if (invData) {
        setInvestors(invData);

        // Fetch unread messages count where receiver is current admin
        const { data: msgData } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        if (msgData) {
          const counts = {};
          msgData.forEach((m) => {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
          });
          setUnreadCounts(counts);
        }
      }
    };

    if (user) fetchInvestorsAndUnreads();
  }, [user]);

  // Global Realtime Listener for Incoming Messages across ALL investors
  useEffect(() => {
    if (!user) return;

    const globalChannel = supabase
      .channel('admin_global_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          // If message is sent TO admin FROM an investor
          if (newMsg.receiver_id === user.id) {
            // If this investor is NOT currently selected, increment unread badge count
            if (!selectedInvestor || selectedInvestor.id !== newMsg.sender_id) {
              setUnreadCounts((prev) => ({
                ...prev,
                [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1,
              }));
              showCustomToast("New Message", "You have received a new message from an investor.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [user, selectedInvestor]);

  // Select Investor & mark messages as read
  const handleSelectInvestor = async (inv) => {
    setSelectedInvestor(inv);
    setManagerNameInput(inv.manager_name || 'BiggoHomes Concierge');
    setIsEditingManager(false);

    // Clear unread badge for this investor
    setUnreadCounts((prev) => ({ ...prev, [inv.id]: 0 }));

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', inv.id)
      .eq('receiver_id', user.id);
  };

  // Fetch conversation for selected investor
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

    const chatChannel = supabase
      .channel(`admin_chat_${selectedInvestor.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (
            (payload.new.sender_id === selectedInvestor.id && payload.new.receiver_id === user.id) ||
            (payload.new.sender_id === user.id && payload.new.receiver_id === selectedInvestor.id)
          ) {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
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
      is_read: false,
    });
  };

  // Save text-only manager details update
  const handleSaveManagerName = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_name: managerNameInput })
        .eq('id', selectedInvestor.id);

      if (error) throw error;

      setSelectedInvestor((prev) => ({ ...prev, manager_name: managerNameInput }));
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === selectedInvestor.id ? { ...inv, manager_name: managerNameInput } : inv))
      );

      setIsEditingManager(false);
      showCustomToast("Manager Updated", `Account manager set to "${managerNameInput}" for ${selectedInvestor.full_name}.`);
    } catch (err) {
      showCustomToast("Update Failed", err.message || "Failed to update profile.", "error");
    }
  };

  const handleImageUploadAndSave = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInvestor) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedInvestor.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('manager-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('manager-avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ manager_name: managerNameInput, manager_avatar: avatarUrl })
        .eq('id', selectedInvestor.id);

      if (updateError) throw updateError;

      setSelectedInvestor(prev => ({ ...prev, manager_name: managerNameInput, manager_avatar: avatarUrl }));
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === selectedInvestor.id ? { ...inv, manager_name: managerNameInput, manager_avatar: avatarUrl } : inv))
      );
      
      setIsEditingManager(false);
      showCustomToast("Profile & Photo Updated", `Account manager photo uploaded for ${selectedInvestor.full_name}.`);
    } catch (err) {
      showCustomToast("Upload Failed", err.message || "Failed to upload manager photo.", "error");
    } finally {
      setUploading(false);
    }
  };

  const filteredInvestors = investors.filter(i => 
    i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-[#0B1F4B]/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg flex overflow-hidden font-sans">
      
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
          {filteredInvestors.map((inv) => {
            const unreadCount = unreadCounts[inv.id] || 0;
            return (
              <button
                key={inv.id}
                onClick={() => handleSelectInvestor(inv)}
                className={`w-full p-4 text-left flex items-center justify-between transition ${
                  selectedInvestor?.id === inv.id 
                    ? 'bg-amber-500/10 border-l-4 border-amber-500' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-[#0B1F4B] text-amber-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {inv.full_name ? inv.full_name.slice(0, 2).toUpperCase() : 'IN'}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-extrabold text-amber-500' : 'font-bold'}`}>
                      {inv.full_name || 'Anonymous Investor'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{inv.email}</p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-[#0B1F4B] text-[10px] font-extrabold animate-pulse flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Conversation Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1F4B]">
        {selectedInvestor ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0B1F4B]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0B1F4B] font-extrabold flex items-center justify-center text-sm overflow-hidden">
                  {selectedInvestor.manager_avatar ? (
                    <img src={selectedInvestor.manager_avatar} alt="Manager" className="w-full h-full object-cover" />
                  ) : (
                    selectedInvestor.manager_name ? selectedInvestor.manager_name.slice(0, 2).toUpperCase() : 'AM'
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{selectedInvestor.full_name}</h4>
                  <p className="text-[11px] text-amber-500 font-semibold">
                    Assigned Manager: {selectedInvestor.manager_name || 'BiggoHomes Concierge'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditingManager(!isEditingManager)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isEditingManager ? 'Close Config' : 'Configure Manager'}</span>
              </button>
            </div>

            {isEditingManager && (
              <div className="p-4 bg-slate-50 dark:bg-[#071326] border-b border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Set Account Manager for {selectedInvestor.full_name}</h5>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Manager Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={managerNameInput}
                        onChange={(e) => setManagerNameInput(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveManagerName}
                        className="px-3 py-2 bg-amber-500 text-[#0B1F4B] text-xs font-bold rounded-xl hover:bg-amber-400 transition"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Upload Manager Photo</label>
                    <label className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-xs rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-[#10213B] cursor-pointer hover:border-amber-500 transition">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-amber-500" />
                          <span className="truncate">Choose Image File</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUploadAndSave} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

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
            <p className="text-xs max-w-xs mt-1">Choose an investor from the left list to view their messages or configure their account manager.</p>
          </div>
        )}
      </div>

    </div>
  );
}