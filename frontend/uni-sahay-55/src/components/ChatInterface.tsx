import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, Bot, User, Globe, GraduationCap,
  DollarSign, Calendar, FileText, MapPin, Phone, Award,
  RefreshCw, AlertCircle,
  User2Icon,Book,Building2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

const categoryButtons = [
  { icon: FileText, label: 'Course Details', key: 'courses' },
  { icon: DollarSign, label: 'Fee Structure', key: 'fees' },
  { icon: GraduationCap, label: 'Admission Process', key: 'admission' },
  { icon: Award, label: 'Scholarship Information', key: 'scholarship' },
  { icon: MapPin, label: 'Campus Facilities', key: 'facilities' },
  { icon: Calendar, label: 'Academic Calendar', key: 'calendar' },
  { icon: Phone, label: 'Contact Information', key: 'contact' },
  { icon: User2Icon, label: 'HOD', key: 'hod' },
  { icon: Book, label: 'Books on Programming', key: 'books' },
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
    <div className="flex flex-col h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gray-700 text-primary-foreground p-4 shadow-elegant">
        <div className="flex items-center justify-between max-w-4xl mx-">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 bg-primary-glow">
              <AvatarFallback><Bot className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold">BROFESSOR</h1>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-primary-foreground/80 text-sm">
                Invertis University {!isOnline && '(Offline Mode)'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowNewChatDialog(true)} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-primary-glow/20 text-primary-foreground border-0 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/20"
              >
                {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Banner */}
      {!isOnline && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-3 text-orange-700 text-sm">
          <div className="flex items-center max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Backend connection lost. Using offline responses.</span>
            <Button onClick={checkBackendConnection} variant="ghost" size="sm" className="ml-auto text-orange-700">Retry</Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.type==='user'?'justify-end':'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] ${msg.type==='user'?'flex-row-reverse space-x-reverse':''}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={msg.type==='user'?'bg-chat-user text-chat-user-foreground':'bg-chat-assistant text-chat-assistant-foreground'}>
                    {msg.type==='user'?<User className="h-4 w-4"/>:<Bot className="h-4 w-4"/>}
                  </AvatarFallback>
                </Avatar>
                <Card className={`shadow-chat ${msg.type==='user'?'bg-gray-700 text-chat-user-foreground':'bg-chat-assistant text-chat-assistant-foreground'}`}>
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-chat-assistant text-chat-assistant-foreground"><Bot className="h-4 w-4"/></AvatarFallback></Avatar>
                <Card className="bg-chat-assistant text-chat-assistant-foreground shadow-chat">
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
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
      <div className="p-4 bg-background border-t w-full max-w-8xl mx-auto">
  {/* Category Buttons */}
  <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
    {categoryButtons.map((cat) => (
      <Button
        key={cat.key}
        variant="outline"
        size="sm"
        className="h-auto px-3 py-2 flex flex-col items-center space-y-1 text-xs rounded-xl shadow-sm hover:shadow-md transition flex-shrink-0"
        onClick={() => handleCategoryClick(cat.key)}
        disabled={isTyping}
      >
        <cat.icon className="h-4 w-4" />
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
      className="flex-1 rounded-2xl px-4 py-3 bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
      onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
      disabled={isTyping}
    />
    <Button
      onClick={() => handleSendMessage(inputValue)}
      disabled={!inputValue.trim() || isTyping}
      className="rounded-2xl px-5 bg-purple-900 hover:bg-purple-700 text-white transition shadow-sm hover:shadow-md"
    >
      <Send className="h-5 w-5" />
    </Button>
  </div>
</div>


      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 mx-4 w-full max-w-sm shadow-elegant">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Your campus assistant</h3>
              <p className="text-muted-foreground text-sm">How can I help you today?</p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleNewChat} className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">Start new chat</Button>
              <Button onClick={() => setShowNewChatDialog(false)} variant="ghost" className="w-full">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
