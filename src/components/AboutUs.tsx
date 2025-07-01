import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
}

interface Achievement {
  id: string;
  number: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  milestone: string;
}

const AboutUs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'story' | 'mission' | 'team' | 'values'>('story');

  const achievements: Achievement[] = [
    {
      id: '1',
      number: '50K+',
      label: 'Job Seekers',
      description: 'Active users finding opportunities',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      id: '2',
      number: '10K+',
      label: 'Companies',
      description: 'Trusted employers using our platform',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: '3',
      number: '100K+',
      label: 'Jobs Posted',
      description: 'Opportunities created',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: '4',
      number: '95%',
      label: 'Success Rate',
      description: 'Job seekers finding positions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      bio: 'Former tech executive with 15+ years in recruitment technology. Passionate about connecting talent with opportunity.',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      twitter: 'https://twitter.com/sarahjohnson'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'AI/ML expert leading our technology innovation. Previously at Google and Microsoft.',
      linkedin: 'https://linkedin.com/in/michaelchen',
      twitter: 'https://twitter.com/michaelchen'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      bio: 'Product strategist focused on user experience and market growth. Expert in job market dynamics.',
      linkedin: 'https://linkedin.com/in/emilyrodriguez',
      twitter: 'https://twitter.com/emilyrodriguez'
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'Head of Engineering',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      bio: 'Full-stack engineering leader building scalable solutions for millions of users.',
      linkedin: 'https://linkedin.com/in/davidkim',
      twitter: 'https://twitter.com/davidkim'
    }
  ];

  const timelineEvents: TimelineEvent[] = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Selectz was born from a vision to revolutionize job matching through AI and human-centered design.',
      milestone: 'Founded'
    },
    {
      year: '2021',
      title: 'First 10K Users',
      description: 'Reached our first major milestone with 10,000 active job seekers and 500 companies.',
      milestone: 'Growth'
    },
    {
      year: '2022',
      title: 'AI Matching Launch',
      description: 'Introduced our proprietary AI job matching algorithm, improving match accuracy by 40%.',
      milestone: 'Innovation'
    },
    {
      year: '2023',
      title: 'Series A Funding',
      description: 'Secured $15M in funding to expand our platform and team.',
      milestone: 'Investment'
    },
    {
      year: '2024',
      title: 'Video Resumes',
      description: 'Launched revolutionary video resume feature, transforming how candidates present themselves.',
      milestone: 'Revolution'
    }
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'We constantly push boundaries in recruitment technology to create better experiences for everyone.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Transparency',
      description: 'We believe in open communication and clear processes that build trust with our users.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Empowerment',
      description: 'We empower both job seekers and employers to achieve their goals through better connections.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from product quality to customer support.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About Selectz
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing the way people find jobs and companies find talent through 
            innovative AI-powered matching and human-centered design.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-blue-600 mb-4 flex justify-center">
                {achievement.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{achievement.number}</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">{achievement.label}</div>
              <div className="text-gray-600">{achievement.description}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center space-x-2">
            {[
              { id: 'story', label: 'Our Story' },
              { id: 'mission', label: 'Mission & Vision' },
              { id: 'team', label: 'Our Team' },
              { id: 'values', label: 'Values' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Our Story */}
          {activeTab === 'story' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Story</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Selectz was founded in 2020 with a simple yet powerful mission: to make job matching 
                    more human, more accurate, and more efficient. Our founders experienced firsthand the 
                    frustrations of traditional job boards and recruitment processes.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    What started as a small team of passionate individuals has grown into a company 
                    serving tens of thousands of job seekers and employers across the country. We've 
                    remained true to our core belief that technology should enhance human connections, 
                    not replace them.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Today, we're proud to be at the forefront of recruitment innovation, combining 
                    cutting-edge AI with deep human understanding to create meaningful career connections.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Journey</h3>
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">{event.year}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h4>
                          <p className="text-gray-600 mb-2">{event.description}</p>
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {event.milestone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mission & Vision */}
          {activeTab === 'mission' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Mission & Vision</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    To democratize access to meaningful career opportunities by creating the most 
                    intelligent and human-centered job matching platform. We believe everyone deserves 
                    to find work that not only pays the bills but fulfills their potential and passion.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    A world where finding the right job or the right candidate is effortless, 
                    where technology enhances human potential, and where every career connection 
                    leads to mutual growth and success.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">What We Believe</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Human-First Technology</h4>
                    <p className="text-blue-100">AI should enhance human connections, not replace them.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Equal Opportunity</h4>
                    <p className="text-blue-100">Everyone deserves access to meaningful career opportunities.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Continuous Innovation</h4>
                    <p className="text-blue-100">We never stop improving and evolving our platform.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Our Team */}
          {activeTab === 'team' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Meet Our Team</h2>
              <p className="text-lg text-gray-700 mb-12 max-w-3xl">
                We're a diverse team of passionate individuals united by our mission to transform 
                the job market. From engineers to designers, from data scientists to customer success 
                specialists, we're all committed to making Selectz the best platform for career connections.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                    <div className="flex justify-center space-x-3">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          {activeTab === 'values' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
              <p className="text-lg text-gray-700 mb-12 max-w-3xl">
                These core values guide everything we do, from product development to customer service. 
                They're not just words on a wall—they're the principles that drive our decisions and actions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {values.map((value, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="text-blue-600 mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-xl mb-6 opacity-90">
            Ready to be part of something bigger? We're always looking for passionate individuals 
            to join our team and help us transform the future of work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/careers"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              View Open Positions
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 