// This is a placeholder component for the Help Center page. Replace with actual content and routing as needed.
import React, { useState } from 'react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories: Category[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      description: 'Learn the basics of using Selectz'
    },
    {
      id: 'job-searching',
      name: 'Job Searching',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      description: 'Find and apply to jobs effectively'
    },
    {
      id: 'profile-management',
      name: 'Profile Management',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      description: 'Manage your profile and settings'
    },
    {
      id: 'applications',
      name: 'Applications',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Track and manage your applications'
    },
    {
      id: 'employer-features',
      name: 'Employer Features',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      description: 'Post jobs and manage candidates'
    },
    {
      id: 'account-billing',
      name: 'Account & Billing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      description: 'Manage your account and payments'
    }
  ];

  const faqs: FAQ[] = [
    // Getting Started
    {
      id: 'gs-1',
      category: 'getting-started',
      question: 'How do I create an account on Selectz?',
      answer: 'To create an account, click the "Sign Up" button in the top right corner. You can sign up using your email address or connect with your Google or LinkedIn account. Follow the verification steps to complete your registration.',
      tags: ['account', 'signup', 'registration']
    },
    {
      id: 'gs-2',
      category: 'getting-started',
      question: 'What\'s the difference between a job seeker and employer account?',
      answer: 'Job seeker accounts are for individuals looking for employment opportunities. They can search jobs, apply to positions, and manage their profiles. Employer accounts are for companies and recruiters who want to post jobs, review applications, and manage their hiring process.',
      tags: ['account-types', 'job-seeker', 'employer']
    },
    {
      id: 'gs-3',
      category: 'getting-started',
      question: 'How do I switch between job seeker and employer modes?',
      answer: 'If you have both job seeker and employer roles, you can switch between them using the role selector in your account settings. This allows you to manage both your job search and hiring activities from the same account.',
      tags: ['roles', 'switching', 'settings']
    },

    // Job Searching
    {
      id: 'js-1',
      category: 'job-searching',
      question: 'How do I search for jobs effectively?',
      answer: 'Use our advanced search filters to narrow down results by location, job type, salary range, and keywords. Save your search criteria to get notified when new matching jobs are posted. You can also use our AI-powered job matching feature for personalized recommendations.',
      tags: ['search', 'filters', 'ai-matching']
    },
    {
      id: 'js-2',
      category: 'job-searching',
      question: 'How do I save jobs for later?',
      answer: 'Click the heart icon on any job listing to save it to your favorites. You can access all your saved jobs from the "Favourites" section in your profile. This helps you keep track of interesting opportunities.',
      tags: ['favorites', 'saving', 'bookmarks']
    },
    {
      id: 'js-3',
      category: 'job-searching',
      question: 'How do I set up job alerts?',
      answer: 'Go to your account settings and navigate to "Job Alerts". You can create custom alerts based on your search criteria, location preferences, and job categories. We\'ll send you email notifications when new matching jobs are posted.',
      tags: ['alerts', 'notifications', 'email']
    },

    // Profile Management
    {
      id: 'pm-1',
      category: 'profile-management',
      question: 'How do I update my profile information?',
      answer: 'Go to your profile page and click "Edit Profile". You can update your personal information, work experience, education, skills, and preferences. Make sure to keep your profile current to improve your job matching results.',
      tags: ['profile', 'editing', 'information']
    },
    {
      id: 'pm-2',
      category: 'profile-management',
      question: 'How do I upload my resume?',
      answer: 'In your profile settings, go to the "Documents" section and click "Upload Resume". We support PDF, DOC, and DOCX formats. You can upload multiple versions of your resume and choose which one to use for applications.',
      tags: ['resume', 'upload', 'documents']
    },
    {
      id: 'pm-3',
      category: 'profile-management',
      question: 'How do I make my profile private?',
      answer: 'In your privacy settings, you can control who can see your profile. You can make it visible to all employers, only to employers you apply to, or completely private. You can also control which information is displayed.',
      tags: ['privacy', 'visibility', 'settings']
    },

    // Applications
    {
      id: 'app-1',
      category: 'applications',
      question: 'How do I apply for a job?',
      answer: 'Click the "Apply" button on any job listing. You can choose to apply with your profile information, upload a custom resume, or both. Some jobs may require additional questions or assessments. Complete all required fields and submit your application.',
      tags: ['apply', 'application', 'submission']
    },
    {
      id: 'app-2',
      category: 'applications',
      question: 'How do I track my applications?',
      answer: 'Go to "My Jobs" in your profile to see all your applications. You can view the status of each application, see when employers view your profile, and track your application progress. We\'ll also send you email updates on your applications.',
      tags: ['tracking', 'status', 'my-jobs']
    },
    {
      id: 'app-3',
      category: 'applications',
      question: 'Can I withdraw my application?',
      answer: 'Yes, you can withdraw your application from the "My Jobs" section. Click on the application and select "Withdraw Application". Note that some employers may have already reviewed your application, so withdrawal doesn\'t guarantee they won\'t contact you.',
      tags: ['withdraw', 'cancel', 'application']
    },

    // Employer Features
    {
      id: 'ef-1',
      category: 'employer-features',
      question: 'How do I post a job?',
      answer: 'Switch to employer mode and click "Post Job" from your dashboard. Fill in the job details including title, description, requirements, location, and salary. You can also set application questions and screening criteria. Review and publish your job posting.',
      tags: ['post-job', 'job-posting', 'employer']
    },
    {
      id: 'ef-2',
      category: 'employer-features',
      question: 'How do I review applications?',
      answer: 'Go to the "Applications" section in your employer dashboard. You can view all applications for your job postings, filter by status, and use our screening tools to identify the best candidates. You can also message candidates directly through the platform.',
      tags: ['review', 'applications', 'candidates']
    },
    {
      id: 'ef-3',
      category: 'employer-features',
      question: 'How do I manage my company profile?',
      answer: 'In your employer settings, go to "Company Profile" to add or update your company information, logo, description, and culture details. A complete company profile helps attract better candidates and builds trust with job seekers.',
      tags: ['company', 'profile', 'employer']
    },

    // Account & Billing
    {
      id: 'ab-1',
      category: 'account-billing',
      question: 'How do I change my password?',
      answer: 'Go to your account settings and click "Change Password". Enter your current password and your new password twice for confirmation. Make sure your new password is strong and unique.',
      tags: ['password', 'security', 'account']
    },
    {
      id: 'ab-2',
      category: 'account-billing',
      question: 'How do I delete my account?',
      answer: 'In your account settings, scroll to the bottom and click "Delete Account". You\'ll need to confirm your decision and enter your password. Note that this action is permanent and will delete all your data from our platform.',
      tags: ['delete', 'account', 'permanent']
    },
    {
      id: 'ab-3',
      category: 'account-billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through our payment partners.',
      tags: ['payment', 'billing', 'credit-cards']
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and learn how to make the most of Selectz.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-6 rounded-2xl text-left transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                  selectedCategory === 'all' ? 'bg-white bg-opacity-20' : 'bg-blue-100'
                }`}>
                  <svg className={`w-6 h-6 ${selectedCategory === 'all' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">All Topics</h3>
              </div>
              <p className={`text-sm ${selectedCategory === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>
                Browse all help articles and FAQs
              </p>
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-6 rounded-2xl text-left transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    selectedCategory === category.id ? 'bg-white bg-opacity-20' : 'bg-blue-100'
                  }`}>
                    <div className={`w-6 h-6 ${selectedCategory === category.id ? 'text-white' : 'text-blue-600'}`}>
                      {category.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                </div>
                <p className={`text-sm ${selectedCategory === category.id ? 'text-blue-100' : 'text-gray-600'}`}>
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Results */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
            </h2>
            <span className="text-gray-600">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredFAQs.length > 0 ? (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                          expandedFAQ === faq.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse our categories above.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl mb-6 opacity-90">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
              Contact Support
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter; 