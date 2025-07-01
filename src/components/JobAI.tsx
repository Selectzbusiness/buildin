import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

interface JobAIProps {
  context?: 'job-search' | 'resume' | 'interview' | 'career' | 'general';
  className?: string;
}

const JobAI: React.FC<JobAIProps> = ({ context = 'general', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const contextPrompts = {
    'job-search': 'I\'m helping you with job search. Ask me about finding jobs, optimizing your search, or job market insights.',
    'resume': 'I\'m helping you with resume writing and optimization. Ask me about resume tips, formatting, or content suggestions.',
    'interview': 'I\'m helping you with interview preparation. Ask me about interview tips, common questions, or how to present yourself.',
    'career': 'I\'m helping you with career guidance. Ask me about career paths, skill development, or professional growth.',
    'general': 'I\'m your job and career assistant. How can I help you today?'
  };

  const quickQuestions = {
    'job-search': [
      'How do I find remote jobs?',
      'What are the best job search strategies?',
      'How do I network effectively?'
    ],
    'resume': [
      'How do I make my resume stand out?',
      'What should I include in my resume?',
      'How do I tailor my resume for different jobs?'
    ],
    'interview': [
      'What are common interview questions?',
      'How do I answer "Tell me about yourself"?',
      'How do I prepare for behavioral interviews?'
    ],
    'career': [
      'How do I switch careers?',
      'What skills are in demand?',
      'How do I negotiate salary?'
    ],
    'general': [
      'How do I optimize my resume?',
      'What are the best interview tips?',
      'How do I use Selectz effectively?'
    ]
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setResponse('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'HTTP-Referer': 'https://www.risky.com',
          'X-Title': 'style',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [
            {
              role: 'system',
              content: `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
              You provide expert advice on:
              - Job search strategies and techniques
              - Resume writing and optimization
              - Interview preparation and techniques
              - Career development and planning
              - Professional networking
              - Salary negotiation
              - Industry insights and trends
              
              Context: ${contextPrompts[context]}
              
              Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`
            },
            { role: 'user', content: inputValue }
          ],
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your request. Please try again.';
      setResponse(aiResponse);
    } catch (error) {
      setResponse('Sorry, I encountered an error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Career Assistant</h3>
          <p className="text-gray-600">Get personalized advice for your career journey</p>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions[context].map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your career..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Send Button */}
      <button
        onClick={sendMessage}
        disabled={!inputValue.trim() || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Getting advice...
          </div>
        ) : (
          'Get AI Advice'
        )}
      </button>

      {/* Response */}
      {response && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">AI Response:</h4>
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{
              __html: marked(response, { breaks: true })
            }}
          />
        </div>
      )}

      {/* Clear Button */}
      {response && (
        <button
          onClick={() => {
            setResponse('');
            setInputValue('');
          }}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear conversation
        </button>
      )}
    </div>
  );
};

export default JobAI; 