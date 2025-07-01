// This is a placeholder component for the Privacy Policy page. Replace with actual content and routing as needed.
import React, { useState } from 'react';

interface Section {
  id: string;
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Overview',
      content: 'At Selectz, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our job matching and recruitment platform.',
      subsections: [
        {
          title: 'Scope',
          content: 'This Privacy Policy applies to all users of the Selectz platform, including job seekers, employers, and visitors to our website. It covers all personal information we collect through our services.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to access, correct, delete, and restrict the processing of your personal information. You also have the right to data portability and to object to processing.'
        }
      ]
    },
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us and information we obtain automatically when you use our platform.',
      subsections: [
        {
          title: 'Information You Provide',
          content: 'Personal information (name, email, phone number), professional information (resume, work history, skills), account credentials, and communications with us or other users.'
        },
        {
          title: 'Automatically Collected Information',
          content: 'Device information, IP address, browser type, usage data, cookies, and similar technologies to enhance your experience and provide personalized services.'
        },
        {
          title: 'Third-Party Information',
          content: 'Information from social media platforms (if you connect your accounts), background check providers (with your consent), and other third-party services.'
        }
      ]
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      content: 'We use your information to provide, improve, and personalize our services, communicate with you, and ensure platform security.',
      subsections: [
        {
          title: 'Service Provision',
          content: 'Matching you with relevant job opportunities, facilitating applications, managing your profile, and providing customer support.'
        },
        {
          title: 'Platform Improvement',
          content: 'Analyzing usage patterns, developing new features, improving user experience, and conducting research to enhance our services.'
        },
        {
          title: 'Communication',
          content: 'Sending job alerts, application updates, platform notifications, and marketing communications (with your consent).'
        },
        {
          title: 'Security and Compliance',
          content: 'Preventing fraud, ensuring platform security, complying with legal obligations, and enforcing our terms of service.'
        }
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      content: 'We may share your information in specific circumstances, always with appropriate safeguards and controls.',
      subsections: [
        {
          title: 'With Employers',
          content: 'When you apply for a job, we share your application materials and profile information with the relevant employer. You control what information is shared.'
        },
        {
          title: 'Service Providers',
          content: 'We work with trusted third-party service providers who help us operate our platform (hosting, analytics, customer support). These providers are bound by confidentiality obligations.'
        },
        {
          title: 'Legal Requirements',
          content: 'We may disclose information when required by law, to protect our rights, or to prevent fraud or harm to users or the public.'
        },
        {
          title: 'Business Transfers',
          content: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.'
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: 'We implement comprehensive security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.',
      subsections: [
        {
          title: 'Technical Safeguards',
          content: 'Encryption of data in transit and at rest, secure servers, regular security audits, and access controls to protect your information.'
        },
        {
          title: 'Organizational Measures',
          content: 'Employee training on data protection, strict access policies, and regular security assessments to maintain the highest security standards.'
        },
        {
          title: 'Incident Response',
          content: 'We have procedures in place to respond to security incidents and will notify you promptly if your information is compromised.'
        }
      ]
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: 'We retain your personal information only as long as necessary to provide our services and comply with legal obligations.',
      subsections: [
        {
          title: 'Retention Periods',
          content: 'Account information is retained while your account is active and for a reasonable period after deactivation. Application data is retained as needed for the hiring process.'
        },
        {
          title: 'Deletion',
          content: 'You can request deletion of your account and associated data at any time. We will delete your information within 30 days of your request.'
        },
        {
          title: 'Legal Requirements',
          content: 'Some information may be retained longer to comply with legal obligations, resolve disputes, or enforce our agreements.'
        }
      ]
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      content: 'You have several rights regarding your personal information, and we are committed to helping you exercise these rights.',
      subsections: [
        {
          title: 'Access and Portability',
          content: 'You can access your personal information and request a copy of your data in a portable format.'
        },
        {
          title: 'Correction and Update',
          content: 'You can correct inaccurate information and update your profile at any time through your account settings.'
        },
        {
          title: 'Deletion',
          content: 'You can request deletion of your account and personal information, subject to certain legal and contractual limitations.'
        },
        {
          title: 'Restriction and Objection',
          content: 'You can restrict processing of your information or object to certain uses, such as marketing communications.'
        }
      ]
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies and Tracking Technologies',
      content: 'We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.',
      subsections: [
        {
          title: 'Types of Cookies',
          content: 'Essential cookies for platform functionality, analytics cookies to understand usage patterns, and marketing cookies for personalized content.'
        },
        {
          title: 'Cookie Management',
          content: 'You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.'
        },
        {
          title: 'Third-Party Tracking',
          content: 'We may use third-party analytics and advertising services that use tracking technologies. These services have their own privacy policies.'
        }
      ]
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      content: 'Your information may be transferred to and processed in countries other than your own, always with appropriate safeguards.',
      subsections: [
        {
          title: 'Transfer Locations',
          content: 'We may transfer your information to countries where our servers are located or where our service providers operate.'
        },
        {
          title: 'Safeguards',
          content: 'We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and adequacy decisions.'
        },
        {
          title: 'Your Rights',
          content: 'You have the same rights regardless of where your information is processed, and we will respond to your requests in accordance with applicable law.'
        }
      ]
    },
    {
      id: 'children-privacy',
      title: 'Children\'s Privacy',
      content: 'Our platform is not intended for children under 18 years of age, and we do not knowingly collect personal information from children.',
      subsections: [
        {
          title: 'Age Verification',
          content: 'We require users to be at least 18 years old to create an account and use our services.'
        },
        {
          title: 'Parental Rights',
          content: 'If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly.'
        }
      ]
    },
    {
      id: 'changes-updates',
      title: 'Changes to This Privacy Policy',
      content: 'We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law.',
      subsections: [
        {
          title: 'Notification of Changes',
          content: 'We will notify you of material changes by posting the updated policy on our platform and updating the "Last Updated" date.'
        },
        {
          title: 'Continued Use',
          content: 'Your continued use of our platform after changes become effective constitutes acceptance of the updated Privacy Policy.'
        }
      ]
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content: 'If you have questions about this Privacy Policy or our privacy practices, please contact us.',
      subsections: [
        {
          title: 'Privacy Team',
          content: 'Email: privacy@selectz.com | Phone: +1 (555) 123-4567 | Address: 123 Privacy Street, Security City, SC 12345'
        },
        {
          title: 'Data Protection Officer',
          content: 'For EU residents, you can contact our Data Protection Officer at dpo@selectz.com for privacy-related inquiries.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are committed to protecting your privacy and being transparent about how we handle your personal information.
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

            {/* Privacy Controls */}
            <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Manage Your Privacy</h3>
              <p className="mb-6 opacity-90">
                Take control of your personal information and privacy settings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-white text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-300">
                  Download My Data
                </button>
                <button className="bg-white text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-300">
                  Privacy Settings
                </button>
                <button className="bg-white text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-300">
                  Contact Privacy Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 