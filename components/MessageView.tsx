import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectMessage, User } from '../types';
import { UsersIcon } from './icons';

interface MessageViewProps {
  messages: ProjectMessage[];
  users: User[];
  currentUser: User;
  onSendMessage: (text: string, chatId: string) => void;
  projectId: string;
}

const createPrivateChatId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
};

const ChatWindow: React.FC<{
    chatId: string;
    chatName: string;
    chatAvatar?: string;
    messages: ProjectMessage[];
    currentUser: User;
    users: User[];
    onSendMessage: (text: string, chatId: string) => void;
}> = ({ chatId, chatName, chatAvatar, messages, currentUser, users, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim(), chatId);
            setInput('');
        }
    };
    
    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-r-xl border-l border-gray-200">
            <header className="p-4 border-b border-gray-200 flex items-center gap-3">
                {chatAvatar ? (
                     <img src={chatAvatar} alt={chatName} className="h-8 w-8 rounded-full" />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <UsersIcon className="h-5 w-5"/>
                    </div>
                )}
                <h2 className="text-lg font-bold text-brand-text">{chatName}</h2>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.length > 0 ? messages.map((msg) => {
                    const sender = userMap.get(msg.senderId);
                    const isCurrentUser = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''} animate-fadeIn`}>
                            {!isCurrentUser && <img src={sender?.avatar} alt={sender?.name} className="h-8 w-8 rounded-full" />}
                            <div>
                                {!isCurrentUser && <p className="text-xs text-gray-500 mb-1 ml-3">{sender?.name}</p>}
                                <div className={`p-3 rounded-xl max-w-md ${isCurrentUser ? 'bg-primary text-white rounded-br-none' : 'bg-white text-brand-text rounded-bl-none shadow-sm border border-gray-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right mr-3' : 'ml-3'}`}>{formatTimestamp(msg.timestamp)}</p>
                            </div>
                            {isCurrentUser && <img src={currentUser.avatar} alt={currentUser.name} className="h-8 w-8 rounded-full" />}
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <p className="font-semibold">No messages yet.</p>
                        <p>Be the first to start the conversation!</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-gray-200 bg-white rounded-br-xl">
                <form onSubmit={handleSend} className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 focus-within:ring-2 focus-within:ring-primary">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${chatName}`}
                        className="flex-1 bg-transparent text-brand-text focus:outline-none px-3"
                    />
                    <button type="submit" disabled={!input.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                        Send
                    </button>
                </form>
            </footer>
        </div>
    );
};


const MessageView: React.FC<MessageViewProps> = ({ messages, users, currentUser, onSendMessage, projectId }) => {
  const [selectedChatId, setSelectedChatId] = useState<string>(projectId);

  const otherUsers = useMemo(() => users.filter(u => u.id !== currentUser.id), [users, currentUser.id]);
  
  const selectedChat = useMemo(() => {
    if (selectedChatId === projectId) {
        return {
            id: projectId,
            name: 'Team Chat',
            avatar: undefined,
            isTeamChat: true,
        };
    }
    const userIds = selectedChatId.split('_');
    const otherUserId = userIds.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);
    return otherUser ? {
        id: selectedChatId,
        name: otherUser.name,
        avatar: otherUser.avatar,
        isTeamChat: false,
    } : null;
  }, [selectedChatId, projectId, users, currentUser.id]);


  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
      <aside className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
        <header className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-brand-text">Conversations</h2>
        </header>
        <div className="flex-1 overflow-y-auto">
            <nav className="p-2 space-y-1">
                {/* Team Chat */}
                <button 
                    onClick={() => setSelectedChatId(projectId)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selectedChatId === projectId ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200'}`}
                >
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                        <UsersIcon className="h-5 w-5"/>
                    </div>
                    <span className="font-semibold text-sm">Team Chat</span>
                </button>

                {/* Separator */}
                <div className="px-2 pt-4 pb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Direct Messages</h3>
                </div>

                {/* Private Chats */}
                {otherUsers.map(user => {
                    const chatId = createPrivateChatId(currentUser.id, user.id);
                    const statusTitle = user.status.charAt(0).toUpperCase() + user.status.slice(1);
                    const statusColor = user.status === 'online' ? 'bg-green-500' : user.status === 'focus' ? 'bg-primary' : 'bg-gray-400';
                    return (
                        <button 
                            key={user.id}
                            onClick={() => setSelectedChatId(chatId)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selectedChatId === chatId ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200'}`}
                        >
                            <div className="relative shrink-0">
                                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full"/>
                                <span
                                    title={statusTitle}
                                    className={`absolute bottom-0 right-0 block rounded-full w-2.5 h-2.5 ${statusColor} ring-2 ring-gray-50`}
                                />
                            </div>
                            <span className="font-semibold text-sm text-brand-text">{user.name}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
      </aside>

      <section className="flex-1">
        {selectedChat ? (
             <ChatWindow
                chatId={selectedChat.id}
                chatName={selectedChat.name}
                chatAvatar={selectedChat.avatar}
                messages={messages.filter(m => m.chatId === selectedChat.id)}
                currentUser={currentUser}
                users={users}
                onSendMessage={onSendMessage}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a conversation to start messaging.</p>
            </div>
        )}
      </section>
    </div>
  );
};

export default MessageView;