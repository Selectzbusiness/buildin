// AI Configuration
export const AI_CONFIG = {
  // API Configuration
  apiKey: process.env.REACT_APP_OPENROUTER_API_KEY,
  serviceUrl: process.env.REACT_APP_AI_SERVICE_URL || 'https://openrouter.ai/api/v1/chat/completions',
  model: process.env.REACT_APP_AI_MODEL || 'deepseek/deepseek-r1:free',
  
  // Headers
  headers: {
    'HTTP-Referer': 'https://www.risky.com',
    'X-Title': 'style',
    'Content-Type': 'application/json',
  },
  
  // System prompts for different contexts
  systemPrompts: {
    'job-search': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with job search. Ask me about finding jobs, optimizing your search, or job market insights.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'resume': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with resume writing and optimization. Ask me about resume tips, formatting, or content suggestions.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'interview': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with interview preparation. Ask me about interview tips, common questions, or how to present yourself.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'career': `You are Selectz Job AI, a specialized assistant for job seekers and career development. 
    You provide expert advice on:
    - Job search strategies and techniques
    - Resume writing and optimization
    - Interview preparation and techniques
    - Career development and planning
    - Professional networking
    - Salary negotiation
    - Industry insights and trends
    
    Context: I'm helping you with career guidance. Ask me about career paths, skill development, or professional growth.
    
    Provide practical, actionable advice. Be encouraging and professional. Keep responses concise but comprehensive.`,
    
    'general': `You are Selectz AI Assistant, a helpful AI assistant for a job matching and recruitment platform. 
    You help users with:
    - Job search advice and tips
    - Resume writing and optimization
    - Interview preparation
    - Career guidance
    - Platform usage questions
    - General job market insights
    
    Be professional, helpful, and provide actionable advice. Keep responses concise but informative.`
  }
};

// Helper function to check if API key is configured
export const isApiKeyConfigured = (): boolean => {
  return !!(AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'your_openrouter_api_key_here');
};

// Helper function to get API key with error handling
export const getApiKey = (): string => {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenRouter API key not configured. Please check your REACT_APP_OPENROUTER_API_KEY environment variable.');
  }
  return AI_CONFIG.apiKey!;
};

// Helper function to validate OpenRouter API key format
export const validateApiKeyFormat = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-or-v1-') && apiKey.length > 20;
};

// Helper function to get API configuration status
export const getApiConfigStatus = () => {
  return {
    hasApiKey: !!AI_CONFIG.apiKey,
    apiKeyFormat: AI_CONFIG.apiKey ? validateApiKeyFormat(AI_CONFIG.apiKey) : false,
    serviceUrl: AI_CONFIG.serviceUrl,
    model: AI_CONFIG.model,
    isConfigured: isApiKeyConfigured()
  };
};

// Helper function to make AI API call
export const makeAIApiCall = async (
  messages: Array<{ role: string; content: string }>,
  context: keyof typeof AI_CONFIG.systemPrompts = 'general'
): Promise<string> => {
  const apiKey = getApiKey();
  
  try {
    const response = await fetch(AI_CONFIG.serviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.risky.com',
        'X-Title': 'style',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: AI_CONFIG.systemPrompts[context]
          },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenRouter API error: ${data.error.message || 'Unknown error'}`);
    }
    
    return data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process your request. Please try again.';
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error: Unable to connect to OpenRouter API');
  }
}; 