import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { FaTrash } from 'react-icons/fa';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: 'text' | 'file' | 'image';
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  is_read: boolean;
  sender_role?: 'employer' | 'jobseeker';
  sender: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface MessagingSystemProps {
  initialTargetId?: string;
  onClose?: () => void;
  currentRole: 'employer' | 'jobseeker';
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ initialTargetId, onClose, currentRole }) => {
  const { user, profile } = useContext(AuthContext);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.auth_id) {
      fetchConversations();
      // Set up real-time subscription for messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.auth_id}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          if (selectedConversation === newMessage.sender_id) {
            setMessages(prev => [...prev, newMessage]);
          }
          updateConversationLastMessage(newMessage);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile?.auth_id, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialTargetId) {
      setSelectedConversation(initialTargetId);
      fetchMessages(initialTargetId);
    }
  }, [initialTargetId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Always select both sender_id and receiver_id
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, message, is_read, sender_role')
        .eq('sender_id', profile?.auth_id)
        .order('created_at', { ascending: false });

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, message, is_read, sender_role')
        .eq('receiver_id', profile?.auth_id)
        .order('created_at', { ascending: false });

      // Combine and deduplicate conversations
      const conversationIds = new Set([
        ...sentMessages?.map(m => m.receiver_id) || [],
        ...receivedMessages?.map(m => m.sender_id) || []
      ]);

      const conversationsData: Conversation[] = [];

      for (const participantId of Array.from(conversationIds)) {
        const lastSentMessage = sentMessages?.find(m => m.receiver_id === participantId);
        const lastReceivedMessage = receivedMessages?.find(m => m.sender_id === participantId);

        let lastMessage = '';
        let lastMessageTime = '';
        let unreadCount = 0;

        if (lastSentMessage && lastReceivedMessage) {
          if (new Date(lastSentMessage.created_at) > new Date(lastReceivedMessage.created_at)) {
            lastMessage = lastSentMessage.message;
            lastMessageTime = lastSentMessage.created_at;
          } else {
            lastMessage = lastReceivedMessage.message;
            lastMessageTime = lastReceivedMessage.created_at;
            unreadCount = receivedMessages?.filter(m => 
              m.sender_id === participantId && !m.is_read
            ).length || 0;
          }
        } else if (lastSentMessage) {
          lastMessage = lastSentMessage.message;
          lastMessageTime = lastSentMessage.created_at;
        } else if (lastReceivedMessage) {
          lastMessage = lastReceivedMessage.message;
          lastMessageTime = lastReceivedMessage.created_at;
          unreadCount = receivedMessages?.filter(m => 
            m.sender_id === participantId && !m.is_read
          ).length || 0;
        }

        // Get participant details (including company_id)
        const { data: participantData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, company_id')
          .eq('auth_id', participantId)
          .single();

        // Filter by role: only show relevant conversations
        let showConversation = false;
        if (participantId === profile?.auth_id) {
          showConversation = true; // always allow self-messaging
        } else if (currentRole === 'jobseeker') {
          showConversation = !!participantData?.company_id; // show if other is employer
        } else if (currentRole === 'employer') {
          showConversation = !participantData?.company_id; // show if other is jobseeker
        }
        if (!showConversation) continue;

        conversationsData.push({
          id: participantId,
          participant_id: participantId,
          participant_name: participantData ? participantData.full_name : 'Unknown User',
          participant_avatar: participantData?.avatar_url,
          last_message: lastMessage,
          last_message_time: lastMessageTime,
          unread_count: unreadCount
        });
      }

      setConversations(conversationsData.sort((a, b) => 
        new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, notify_email, avatar_url)`)
        .or(`and(sender_id.eq.${profile?.auth_id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${profile?.auth_id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      // Show all messages between the two users
      setMessages(data || []);

      // Mark messages as read (including self-messaging)
      if (participantId && profile?.auth_id) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .or(`and(sender_id.eq.${participantId},receiver_id.eq.${profile.auth_id},is_read.eq.false),and(sender_id.eq.${profile.auth_id},receiver_id.eq.${profile.auth_id},is_read.eq.false)`);
        // Refresh conversations from DB to get updated unread counts
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile?.auth_id,
          receiver_id: selectedConversation,
          message: newMessage.trim(),
          message_type: 'text',
          sender_role: currentRole
        });
      if (error) throw error;
      setNewMessage('');
      await fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      setSending(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `messages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // Save message with file
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile?.auth_id,
          receiver_id: selectedConversation,
          message: `File: ${file.name}`,
          message_type: 'file',
          attachment_url: publicUrl,
          attachment_name: file.name
        });

      if (error) throw error;

      await fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setSending(false);
    }
  };

  const updateConversationLastMessage = (message: Message) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.participant_id === message.sender_id || conv.participant_id === message.receiver_id) {
          return {
            ...conv,
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: message.receiver_id === profile?.auth_id ? conv.unread_count + 1 : conv.unread_count
          };
        }
        return conv;
      })
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await supabase.from('messages').delete().eq('id', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      alert('Failed to delete message.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg h-96">
        <div className="animate-pulse p-6">
          <div className="bg-gray-200 h-8 w-32 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] max-w-5xl mx-auto border border-white/30" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'}}>
      {onClose && (
        <button onClick={onClose} className="absolute top-2 right-2 z-10 p-2 bg-white/40 backdrop-blur-md rounded-full hover:bg-white/60 border border-white/30">
          <span className="sr-only">Close</span>
          &times;
        </button>
      )}
      {/* Conversation List */}
      <div className="w-full md:w-96 bg-gradient-to-b from-[#0f2027]/80 via-[#2c5364]/80 to-[#203a43]/80 border-r border-white/20 p-6 overflow-y-auto min-h-[600px]">
        <h2 className="text-xl font-bold text-white mb-6 drop-shadow">Inbox</h2>
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/30 rounded-lg"></div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-white/70 text-center py-12">No conversations yet.</div>
        ) : (
          <ul className="space-y-3">
            {conversations.map(conv => (
              <li
                key={conv.id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border border-white/10 hover:bg-white/10 ${selectedConversation === conv.id ? 'bg-gradient-to-r from-[#0f2027]/80 via-[#2c5364]/80 to-[#203a43]/80 border-white/30 shadow-lg' : ''}`}
                onClick={() => { setSelectedConversation(conv.id); fetchMessages(conv.id); }}
              >
                {conv.participant_avatar ? (
                  <img src={conv.participant_avatar} alt={conv.participant_name || 'User'} className="w-12 h-12 rounded-full object-cover border-2 border-white/40" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-xl font-bold text-white/80 border-2 border-white/40">
                    {(conv.participant_name && typeof conv.participant_name === 'string' && conv.participant_name.length > 0)
                      ? conv.participant_name.charAt(0)
                      : '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate drop-shadow">{conv.participant_name}</div>
                  <div className="text-xs text-white/70 truncate">{conv.last_message}</div>
                </div>
                {conv.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce shadow">{conv.unread_count}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0f2027]/70 via-[#2c5364]/60 to-[#203a43]/80 backdrop-blur-xl">
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-white/20 p-6 bg-white/10 backdrop-blur-md">
              <button
                className="md:hidden text-white/80 hover:text-white text-2xl mr-2"
                onClick={() => setSelectedConversation(null)}
                aria-label="Back to conversations"
              >
                &larr;
              </button>
              <div className="font-bold text-white text-xl drop-shadow">{conversations.find(c => c.id === selectedConversation)?.participant_name}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-transparent">
              {loading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/30 rounded-lg w-1/2"></div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-white/60 text-center py-12">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isSent = msg.sender_role
                    ? msg.sender_role === currentRole
                    : msg.sender_id === profile?.auth_id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`group relative max-w-lg px-6 py-4 rounded-3xl shadow-lg backdrop-blur-md border border-white/20 ${
                        isSent
                          ? 'bg-gradient-to-br from-[#0f2027]/90 via-[#2c5364]/90 to-[#203a43]/90 text-white'
                          : 'bg-white/30 text-[#0f2027]'
                      } transition-all duration-200 animate-fade-in`} style={{backdropFilter: 'blur(12px)'}}>
                        <div className="text-base font-medium">{msg.message}</div>
                        <div className="text-xs text-white/60 mt-2 text-right">{formatTime(msg.created_at)}</div>
                        {isSent && (
                          <button
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-red-500"
                            title="Delete message"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <FaTrash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-6 border-t border-white/20 bg-white/10 backdrop-blur-md flex items-center gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Type your message..."
                className="flex-1 px-6 py-4 rounded-2xl border border-white/30 bg-white/30 text-[#0f2027] placeholder:text-[#2c5364]/60 focus:border-[#2c5364] focus:ring-[#2c5364] transition-colors duration-200 shadow-md backdrop-blur-md text-base font-medium"
                disabled={sending}
                style={{backdropFilter: 'blur(8px)'}}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="px-8 py-4 bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#203a43] text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition-colors duration-200 disabled:bg-gray-300 text-lg"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-16 text-white/60">
            <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="text-2xl font-semibold">Select a conversation to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem; 