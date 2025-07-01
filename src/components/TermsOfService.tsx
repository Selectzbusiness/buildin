// This is a placeholder component for the Terms of Service page. Replace with actual content and routing as needed.
import React, { useState } from 'react';

interface Section {
  id: string;
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

const TermsOfService: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');

  const sections: Section[] = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: 'By accessing and using Selectz ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
      subsections: [
        {
          title: 'Eligibility',
          content: 'You must be at least 18 years old to use our services. By using the Platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into this agreement.'
        },
        {
          title: 'Account Registration',
          content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.'
        }
      ]
    },
    {
      id: 'services',
      title: 'Description of Services',
      content: 'Selectz provides a job matching and recruitment platform that connects job seekers with employers. Our services include job posting, application management, profile creation, and communication tools.',
      subsections: [
        {
          title: 'Job Postings',
          content: 'Employers may post job opportunities on our platform. We reserve the right to review, edit, or remove job postings that violate our policies or applicable laws.'
        },
        {
          title: 'Applications',
          content: 'Job seekers may apply to posted positions through our platform. We facilitate the application process but are not responsible for hiring decisions made by employers.'
        }
      ]
    },
    {
      id: 'user-conduct',
      title: 'User Conduct and Responsibilities',
      content: 'You agree to use the Platform only for lawful purposes and in accordance with these Terms. You are responsible for all content you submit, post, or display on the Platform.',
      subsections: [
        {
          title: 'Prohibited Activities',
          content: 'You may not: (a) violate any applicable laws or regulations; (b) infringe on intellectual property rights; (c) post false or misleading information; (d) harass, abuse, or harm others; (e) attempt to gain unauthorized access to our systems.'
        },
        {
          title: 'Content Standards',
          content: 'All content must be accurate, truthful, and appropriate. You may not post discriminatory, offensive, or inappropriate content. We reserve the right to remove content that violates these standards.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy and Data Protection',
      content: 'Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.',
      subsections: [
        {
          title: 'Data Collection',
          content: 'We collect information you provide directly to us, such as when you create an account, post a job, or submit an application. We also collect information automatically through your use of the Platform.'
        },
        {
          title: 'Data Usage',
          content: 'We use your information to provide our services, improve the Platform, communicate with you, and ensure compliance with our policies and applicable laws.'
        }
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property Rights',
      content: 'The Platform and its original content, features, and functionality are owned by Selectz and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.',
      subsections: [
        {
          title: 'Your Content',
          content: 'You retain ownership of content you submit to the Platform. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with our services.'
        },
        {
          title: 'Platform Content',
          content: 'You may not copy, modify, distribute, sell, or lease any part of our Platform without our prior written consent.'
        }
      ]
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      content: 'The Platform is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the Platform will be uninterrupted, secure, or error-free.',
      subsections: [
        {
          title: 'No Warranty',
          content: 'We disclaim all warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.'
        },
        {
          title: 'Limitation of Liability',
          content: 'In no event shall Selectz be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform.'
        }
      ]
    },
    {
      id: 'termination',
      title: 'Termination',
      content: 'We may terminate or suspend your account and access to the Platform at any time, with or without cause, with or without notice, effective immediately.',
      subsections: [
        {
          title: 'Account Termination',
          content: 'You may terminate your account at any time by contacting us. Upon termination, your right to use the Platform will cease immediately.'
        },
        {
          title: 'Effect of Termination',
          content: 'Upon termination, we may delete your account and all associated data, except where we are required to retain information for legal or regulatory purposes.'
        }
      ]
    },
    {
      id: 'governing-law',
      title: 'Governing Law and Disputes',
      content: 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Selectz operates, without regard to its conflict of law provisions.',
      subsections: [
        {
          title: 'Dispute Resolution',
          content: 'Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.'
        },
        {
          title: 'Jurisdiction',
          content: 'You agree to submit to the personal jurisdiction of the courts located within the jurisdiction where Selectz operates for any legal proceedings.'
        }
      ]
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      content: 'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on the Platform and updating the "Last Updated" date.',
      subsections: [
        {
          title: 'Notification',
          content: 'Continued use of the Platform after changes become effective constitutes acceptance of the new Terms. If you do not agree to the new Terms, you must stop using the Platform.'
        },
        {
          title: 'Material Changes',
          content: 'For material changes, we will provide additional notice through email or prominent notices on the Platform.'
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      content: 'If you have any questions about these Terms of Service, please contact us at legal@selectz.com or through our contact form.',
      subsections: [
        {
          title: 'Support',
          content: 'For technical support or general inquiries, please visit our Help Center or contact our support team.'
        },
        {
          title: 'Legal Inquiries',
          content: 'For legal matters or privacy concerns, please contact our legal team directly at legal@selectz.com.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these terms carefully before using our platform. By using Selectz, you agree to be bound by these terms.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {sections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={`p-8 ${activeSection === section.id ? 'block' : 'hidden'}`}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {sections.findIndex(s => s.id === section.id) + 1}
                    </span>
                    {section.title}
                  </h2>
                  
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {section.content}
                    </p>
                    
                    {section.subsections && (
                      <div className="space-y-6">
                        {section.subsections.map((subsection, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              {subsection.title}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                              {subsection.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Need Help Understanding These Terms?</h3>
              <p className="mb-6 opacity-90">
                If you have questions about our Terms of Service, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-300">
                  Contact Support
                </button>
                <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors duration-300">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 