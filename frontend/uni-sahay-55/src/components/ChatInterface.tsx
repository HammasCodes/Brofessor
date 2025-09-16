import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send, Bot, User, Globe, GraduationCap,
  DollarSign, Calendar, FileText, MapPin, Phone, Award,
  RefreshCw, AlertCircle,
  User2Icon, Book, Building2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

const API_BASE_URL = 'https://brofessor-tdx6.onrender.com/api';

const categoryButtons = [
  { icon: FileText, label: 'Course Details', key: 'courses' },
  { icon: DollarSign, label: 'Fee Structure', key: 'fees' },
  { icon: GraduationCap, label: 'Admission Process', key: 'admission' },
  { icon: Award, label: 'Scholarship', key: 'scholarship' },
  { icon: MapPin, label: 'Campus Facilities', key: 'facilities' },
  { icon: Calendar, label: 'Academic Calendar', key: 'calendar' },
  { icon: Phone, label: 'Contact Information', key: 'contact' },
  { icon: User2Icon, label: 'HOD', key: 'hod' },
  { icon: Book, label: 'Programming Books', key: 'books' },
  { icon: GraduationCap, label: 'BCA', key: 'bca' },
  { icon: Building2, label: 'About Invertis', key: 'about' },
  { icon: GraduationCap, label: 'Admission Process', key: 'admission_extra' },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    type: 'assistant',
    content: "Hello! 👋 Welcome to Invertis University!\n\nI'm your AI Campus Assistant. I can assist with courses, fees, admissions, scholarships, campus facilities, and more.",
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => scrollToBottom(), [messages]);
  useEffect(() => { checkBackendConnection(); }, []);

  // Check backend root route
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`); // call your health check route
      setIsOnline(response.ok);
    } catch (error) {
      console.error('Backend connection failed:', error);
      setIsOnline(false);
    }
  };

  const sendMessageToBackend = async (query: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const getFallbackResponse = (userInput: string) => {
    const responses = {
      fees: "The fee structure for different courses varies...",
      scholarship: "We offer various scholarship programs...",
      admission: "Admission process:\n1. Online application...",
      facilities: "Our campus offers labs, hostels, sports, Wi-Fi..."
    };
    const input = userInput.toLowerCase();
    if (input.includes('fee') || input.includes('cost')) return responses.fees;
    if (input.includes('scholarship')) return responses.scholarship;
    if (input.includes('admission') || input.includes('apply')) return responses.admission;
    if (input.includes('facility') || input.includes('campus')) return responses.facilities;
    return "I can help with courses, fees, admissions, scholarships, facilities, and more. Please ask a specific question.";
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      language: selectedLanguage
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendMessageToBackend(content.trim());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        language: selectedLanguage
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
      const fallbackResponse = getFallbackResponse(content.trim());
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `⚠️ Offline mode: ${fallbackResponse}`,
        timestamp: new Date(),
        language: selectedLanguage
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    const categoryQuestions: Record<string, string> = {
      courses: "What courses are available at the university?",
      fees: "What is the fee structure?",
      admission: "What is the admission process?",
      scholarship: "What scholarships are available?",
      facilities: "What facilities are available on campus?",
      calendar: "What is the academic calendar?",
      contact: "How can I contact the university?",
      hod: "Akash Sanghi's sir contact?",
      books: "Can you suggest some books on programming?",
      bca: "Tell me about the BCA program.",
      about: "Tell me about Invertis University.",
      admission_extra: "Please explain the admission process in invertis.",
    };
    handleSendMessage(categoryQuestions[category] || "Tell me more about this topic");
  };

  const handleNewChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hello! 👋 Welcome to Invertis University!\n\nI'm your AI Campus Assistant. I can assist with courses, fees, admissions, scholarships, campus facilities, and more.",
      timestamp: new Date()
    }]);
    setInputValue('');
    setIsTyping(false);
    setShowNewChatDialog(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#171717] text-gray-100 font-sans">
      {/* Header */}
      <div className="bg-[#242424] p-4 shadow-xl border-b border-[#333333] transition-all duration-500 ease-in-out">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-green-500 bg-[#333333] animate-pulse-fast">
              <AvatarFallback><Bot className="h-6 w-6 text-green-500" /></AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">BROFESSOR</h1>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              </div>
              <p className="text-gray-400 text-sm">
                Invertis University {!isOnline && '(Offline Mode)'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowNewChatDialog(true)} variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-gray-200 transition-transform duration-300 hover:scale-110">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-gray-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#333333] text-gray-200 border-0 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Banner */}
      {!isOnline && (
        <div className="bg-red-900/40 border-l-4 border-red-500 p-3 text-red-300 text-sm animate-fade-in-down">
          <div className="flex items-center max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4 mr-2 text-red-500 animate-pulse" />
            <span>Backend connection lost. Using offline responses.</span>
            <Button onClick={checkBackendConnection} variant="ghost" size="sm" className="ml-auto text-red-300 hover:text-red-200 transition-colors">Retry</Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''} animate-fade-in-up`}>
                <Avatar className="h-8 w-8 flex-shrink-0 border border-gray-600">
                  <AvatarFallback className={`bg-[#333333] ${msg.type === 'user' ? 'text-blue-400' : 'text-green-500'}`}>
                    {msg.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <Card className={`rounded-xl shadow-lg border-none ${msg.type === 'user' ? 'bg-[#333333] text-gray-100 rounded-br-none' : 'bg-[#1e1e1e] text-gray-200 rounded-bl-none'}`}>
                  <CardContent className="p-4">
                    <p className="text-sm sm:text-base whitespace-pre-line">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[85%] animate-fade-in-up">
                <Avatar className="h-8 w-8 flex-shrink-0 border border-gray-600"><AvatarFallback className="bg-[#333333] text-green-500"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                <Card className="bg-[#1e1e1e] text-gray-200 rounded-xl shadow-lg rounded-bl-none border-none">
                  <CardContent className="p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Categories & Input */}
      <div className="p-4 bg-[#242424] border-t border-[#333333] w-full max-w-8xl mx-auto">
        {/* Category Buttons */}
        <div className="flex space-x-3 overflow-x-auto pb-4 hide-scrollbar">
          {categoryButtons.map((cat) => (
            <Button
              key={cat.key}
              variant="outline"
              size="sm"
              className="h-auto px-4 py-3 flex flex-col items-center space-y-1 text-xs rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 bg-[#333333] border-[#444444] text-gray-300 hover:bg-[#444444] hover:scale-105"
              onClick={() => handleCategoryClick(cat.key)}
              disabled={isTyping}
            >
              <cat.icon className="h-5 w-5 text-green-500" />
              <span className="text-center leading-tight">{cat.label}</span>
            </Button>
          ))}
        </div>

        {/* Input + Send */}
        <div className="flex space-x-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message..."
            className="flex-1 rounded-full px-5 py-3 bg-[#1e1e1e] text-gray-100 border border-[#333333] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
            disabled={isTyping}
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="rounded-full px-5 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Send className="h-5 w-5 animate-pulse-on-click" />
          </Button>
        </div>
      </div>

      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#242424] rounded-lg p-8 mx-4 w-full max-w-sm shadow-2xl animate-scale-up">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center mb-4 border-2 border-green-500">
                <Bot className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Start a new chat?</h3>
              <p className="text-gray-400 text-sm">This will clear the current conversation.</p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleNewChat} className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors">Start new chat</Button>
              <Button onClick={() => setShowNewChatDialog(false)} variant="ghost" className="w-full text-gray-300 hover:bg-gray-700 transition-colors">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
