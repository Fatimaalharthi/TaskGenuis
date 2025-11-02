import React, { useState, useRef, useEffect } from 'react';
import { getContextualChatbotResponseStream } from '../services/geminiService';
import { User, Task } from '../types';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatbotProps {
    tasks: Task[];
    projectBrief: string;
    currentUser: User;
}

const Chatbot: React.FC<ChatbotProps> = ({ tasks, projectBrief, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only set initial message if it's the very beginning of the chat
    if (messages.length === 0) {
      const initialMessage = "Hello! I'm your project management assistant. I have access to your project brief and task list. Ask me anything about the project!";
      setMessages([{ text: initialMessage, isUser: false }]);
    }
  }, []); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    const userMessage: Message = { text: userInput, isUser: true };

    const history = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
    }));

    setMessages(prev => [...prev, userMessage, { text: '', isUser: false }]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await getContextualChatbotResponseStream(projectBrief, tasks, history, userInput);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && !lastMessage.isUser) {
            lastMessage.text += chunkText;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      let errorText = "Sorry, I'm having trouble connecting. Please try again later.";
      // Check for rate limit error
      if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
          errorText = "I'm experiencing high traffic right now. Please wait a moment before sending another message.";
      }

      const errorMessage: Message = { text: errorText, isUser: false };
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser && newMessages[newMessages.length - 1].text === '') {
            newMessages[newMessages.length - 1] = errorMessage;
        } else {
            newMessages.push(errorMessage);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aiUser = { name: "AI Assistant", avatar: "https://i.pravatar.cc/150?u=ai-assistant" };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
      <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-text">Inbox / AI Assistant</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''} animate-fadeIn`}>
            {!msg.isUser && <img src={aiUser.avatar} alt={aiUser.name} className="h-8 w-8 rounded-full" />}
            <div className={`max-w-md p-3 rounded-xl ${msg.isUser ? 'bg-primary text-white rounded-br-none' : 'bg-white text-brand-text rounded-bl-none shadow-sm border border-gray-200'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}
                 {index === messages.length - 1 && isLoading && !msg.isUser && (
                     <span className="inline-block w-2 h-4 bg-brand-text ml-1 animate-pulse" aria-hidden="true" />
                 )}
              </p>
            </div>
             {msg.isUser && <img src={currentUser.avatar} alt={currentUser.name} className="h-8 w-8 rounded-full" />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 focus-within:ring-2 focus-within:ring-primary">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask anything about your project..."
            className="flex-1 bg-transparent text-brand-text focus:outline-none px-3"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;