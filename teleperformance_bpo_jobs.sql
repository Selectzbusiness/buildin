-- Concentrix BPO Jobs Data
-- Company ID: 3704be73-7409-4e2d-9f6b-1cf936b1a1a7

-- First, create the Concentrix company record
INSERT INTO companies (
    id,
    name,
    description,
    industry,
    size,
    location,
    website,
    founded_year,
    company_type,
    culture,
    benefits,
    bio,
    created_at,
    updated_at
) VALUES (
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    'Concentrix',
    'Concentrix is a global technology and services leader that powers the world''s best brands through customer experience (CX) solutions. We help organizations build stronger relationships with their customers through digital transformation and human connection.',
    'Business Process Outsourcing',
    '300,000+ employees',
    'Mumbai, Maharashtra, India',
    'https://www.concentrix.com',
    1983,
    'Public Limited',
    'We cultivate a culture of innovation, diversity, and excellence where every team member is empowered to make a difference. Our values center around customer obsession, operational excellence, and continuous improvement.',
    'Comprehensive health insurance, performance bonuses, shift allowances, transportation facilities, meal vouchers, learning and development programs, career advancement opportunities, employee recognition programs, and wellness initiatives.',
    'Concentrix is a global leader in customer experience (CX) solutions and technology. With over 40 years of experience, we serve more than 100 countries and help the world''s best brands build stronger relationships with their customers. Our Mumbai centers specialize in customer service, technical support, sales operations, and digital transformation services.',
    NOW(),
    NOW()
);

-- AGENT JOBS (15 positions)

-- 1. Customer Service Agent - English
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Customer Service Agent - English',
    'Handle customer inquiries and provide excellent service support. You will be the first point of contact for customers, resolving their issues and ensuring customer satisfaction.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    240000,
    360000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent English communication skills\n• 12th pass or equivalent\n• 0-2 years of experience in customer service\n• Ability to work in shifts\n• Good problem-solving skills\n• Customer-focused attitude',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Learning Programs'],
    ARRAY['English Communication', 'Customer Service', 'Problem Solving', 'MS Office', 'CRM Systems', 'Active Listening'],
    ARRAY['Full-time'],
    'Fresher',
    '12th Pass',
    0,
    3,
    'active',
    NOW()
);

-- 2. Technical Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Technical Support Agent',
    'Provide technical assistance to customers experiencing issues with products or services. Troubleshoot problems and guide customers through solutions.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    300000,
    420000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Strong technical aptitude\n• 12th pass or equivalent\n• 1-2 years of technical support experience\n• Knowledge of basic troubleshooting\n• Excellent communication skills\n• Ability to work in shifts',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Technical Training'],
    ARRAY['Technical Troubleshooting', 'Customer Service', 'Problem Solving', 'Remote Desktop', 'Knowledge Base', 'Documentation'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    2,
    'active',
    NOW()
);

-- 3. Sales Agent - Outbound
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Sales Agent - Outbound',
    'Make outbound calls to potential customers, present products/services, and achieve sales targets. Build relationships and drive revenue growth.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    280000,
    400000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent communication and persuasion skills\n• 12th pass or equivalent\n• 1-2 years of sales experience\n• Target-driven mindset\n• Ability to handle rejection\n• Good listening skills',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Commission', 'Shift Allowance', 'Transportation', 'Sales Training'],
    ARRAY['Sales Techniques', 'Communication', 'Negotiation', 'CRM Systems', 'Product Knowledge', 'Lead Generation'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    2,
    'active',
    NOW()
);

-- 4. Inbound Sales Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Inbound Sales Agent',
    'Handle incoming sales calls, understand customer needs, and convert inquiries into sales. Provide product information and close deals.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    260000,
    380000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent communication skills\n• 12th pass or equivalent\n• 0-2 years of sales experience\n• Ability to understand customer needs\n• Good product knowledge\n• Sales closing skills',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Commission', 'Shift Allowance', 'Transportation', 'Product Training'],
    ARRAY['Sales Techniques', 'Customer Service', 'Product Knowledge', 'CRM Systems', 'Lead Qualification', 'Closing Skills'],
    ARRAY['Full-time'],
    'Fresher',
    '12th Pass',
    0,
    2,
    'active',
    NOW()
);

-- 5. Chat Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Chat Support Agent',
    'Provide customer support through live chat platforms. Handle multiple chat conversations simultaneously while maintaining quality service.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    220000,
    320000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent written communication skills\n• 12th pass or equivalent\n• 0-2 years of chat support experience\n• Fast typing speed (40+ WPM)\n• Ability to multitask\n• Good grammar and spelling',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Chat Tools Training'],
    ARRAY['Written Communication', 'Chat Support', 'Multitasking', 'Typing Speed', 'Grammar', 'Customer Service'],
    ARRAY['Full-time'],
    'Fresher',
    '12th Pass',
    0,
    2,
    'active',
    NOW()
);

-- 6. Email Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Email Support Agent',
    'Handle customer inquiries and complaints through email communication. Provide detailed responses and ensure customer satisfaction.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    240000,
    340000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent written communication skills\n• 12th pass or equivalent\n• 1-2 years of email support experience\n• Strong grammar and vocabulary\n• Attention to detail\n• Problem-solving skills',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Writing Skills Training'],
    ARRAY['Email Communication', 'Written English', 'Problem Solving', 'Customer Service', 'Documentation', 'Grammar'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    1,
    'active',
    NOW()
);

-- 7. Social Media Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Social Media Support Agent',
    'Monitor and respond to customer inquiries on social media platforms. Maintain brand reputation and provide timely support.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    260000,
    360000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Knowledge of social media platforms\n• 12th pass or equivalent\n• 1-2 years of social media experience\n• Excellent communication skills\n• Crisis management skills\n• Brand awareness',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Social Media Training'],
    ARRAY['Social Media', 'Crisis Management', 'Brand Communication', 'Customer Service', 'Platform Knowledge', 'Response Management'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    1,
    'active',
    NOW()
);

-- 8. Billing Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Billing Support Agent',
    'Handle billing-related customer inquiries, resolve payment issues, and process refunds. Ensure accurate billing information.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    280000,
    380000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Strong numerical skills\n• 12th pass or equivalent\n• 1-2 years of billing experience\n• Attention to detail\n• Good communication skills\n• Knowledge of billing systems',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Billing Systems Training'],
    ARRAY['Billing Systems', 'Numerical Skills', 'Customer Service', 'Payment Processing', 'Refund Processing', 'Attention to Detail'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    1,
    'active',
    NOW()
);

-- 9. Order Processing Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Order Processing Agent',
    'Process customer orders, verify information, and coordinate with logistics teams. Ensure smooth order fulfillment.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    240000,
    340000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Attention to detail\n• 12th pass or equivalent\n• 0-2 years of order processing experience\n• Good communication skills\n• Ability to work under pressure\n• Knowledge of order systems',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Order Systems Training'],
    ARRAY['Order Processing', 'Attention to Detail', 'Customer Service', 'Logistics Coordination', 'Data Entry', 'Problem Solving'],
    ARRAY['Full-time'],
    'Fresher',
    '12th Pass',
    0,
    1,
    'active',
    NOW()
);

-- 10. Product Support Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Product Support Agent',
    'Provide detailed product information and support to customers. Help customers understand product features and resolve usage issues.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    260000,
    360000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Strong product knowledge\n• 12th pass or equivalent\n• 1-2 years of product support experience\n• Excellent communication skills\n• Problem-solving abilities\n• Technical aptitude',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Product Training'],
    ARRAY['Product Knowledge', 'Technical Support', 'Customer Service', 'Problem Solving', 'Documentation', 'Training Skills'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    1,
    'active',
    NOW()
);

-- 11. Complaint Resolution Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Complaint Resolution Agent',
    'Handle escalated customer complaints and resolve complex issues. Ensure customer satisfaction and maintain service quality.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    320000,
    420000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent conflict resolution skills\n• 12th pass or equivalent\n• 2-3 years of complaint handling experience\n• Strong communication skills\n• Ability to remain calm under pressure\n• Problem-solving mindset',
    'Mid-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Conflict Resolution Training'],
    ARRAY['Conflict Resolution', 'Complaint Handling', 'Customer Service', 'Problem Solving', 'Escalation Management', 'Communication'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    2,
    1,
    'active',
    NOW()
);

-- 12. Quality Assurance Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Quality Assurance Agent',
    'Monitor and evaluate customer interactions to ensure quality standards. Provide feedback and coaching to improve service delivery.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    300000,
    400000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Strong analytical skills\n• 12th pass or equivalent\n• 2-3 years of QA experience\n• Attention to detail\n• Good communication skills\n• Coaching abilities',
    'Mid-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'QA Training'],
    ARRAY['Quality Assurance', 'Analytical Skills', 'Coaching', 'Evaluation', 'Feedback', 'Process Improvement'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    2,
    1,
    'active',
    NOW()
);

-- 13. Back Office Processing Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Back Office Processing Agent',
    'Handle data entry, document processing, and administrative tasks. Ensure accuracy and efficiency in back-office operations.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    220000,
    320000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Fast typing speed\n• 12th pass or equivalent\n• 1-2 years of data entry experience\n• Attention to detail\n• Good computer skills\n• Ability to work independently',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Data Entry Training'],
    ARRAY['Data Entry', 'Document Processing', 'MS Office', 'Typing Speed', 'Attention to Detail', 'Administrative Skills'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    1,
    1,
    'active',
    NOW()
);

-- 14. Voice Process Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Voice Process Agent',
    'Handle voice-based customer interactions through phone calls. Provide excellent customer service and resolve issues effectively.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    240000,
    340000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Excellent verbal communication skills\n• 12th pass or equivalent\n• 0-2 years of voice process experience\n• Good listening skills\n• Ability to work in shifts\n• Customer service orientation',
    'Entry-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Voice Training'],
    ARRAY['Voice Communication', 'Customer Service', 'Active Listening', 'Call Handling', 'Problem Solving', 'Communication'],
    ARRAY['Full-time'],
    'Fresher',
    '12th Pass',
    0,
    2,
    'active',
    NOW()
);

-- 15. Escalation Agent
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Escalation Agent',
    'Handle escalated customer issues that require higher-level resolution. Work with management and other departments to resolve complex problems.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    340000,
    440000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• Strong problem-solving skills\n• 12th pass or equivalent\n• 3-4 years of escalation handling experience\n• Excellent communication skills\n• Ability to work under pressure\n• Cross-functional coordination skills',
    'Mid-level',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Leadership Training'],
    ARRAY['Escalation Management', 'Problem Solving', 'Cross-functional Coordination', 'Communication', 'Leadership', 'Crisis Management'],
    ARRAY['Full-time'],
    'Experienced',
    '12th Pass',
    3,
    1,
    'active',
    NOW()
);

-- TEAM LEADER JOBS (5 positions)

-- 16. Customer Service Team Leader
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Customer Service Team Leader',
    'Lead a team of customer service agents, monitor performance, provide coaching, and ensure high-quality service delivery.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    480000,
    600000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• 3-5 years of customer service experience\n• 1-2 years of team leadership experience\n• Graduate degree preferred\n• Strong leadership and coaching skills\n• Excellent communication skills\n• Performance management abilities',
    'Senior',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Leadership Training', 'Career Growth'],
    ARRAY['Team Leadership', 'Performance Management', 'Coaching', 'Customer Service', 'Communication', 'Problem Solving'],
    ARRAY['Full-time'],
    'Experienced',
    'Graduate Degree',
    3,
    1,
    'active',
    NOW()
);

-- 17. Sales Team Leader
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Sales Team Leader',
    'Lead a team of sales agents, set targets, monitor performance, and drive revenue growth through effective team management.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    520000,
    650000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• 3-5 years of sales experience\n• 1-2 years of team leadership experience\n• Graduate degree preferred\n• Strong sales and leadership skills\n• Target-driven mindset\n• Performance management abilities',
    'Senior',
    ARRAY['Health Insurance', 'Performance Bonus', 'Commission', 'Shift Allowance', 'Transportation', 'Leadership Training', 'Career Growth'],
    ARRAY['Sales Leadership', 'Team Management', 'Target Setting', 'Performance Coaching', 'Sales Strategy', 'Motivation'],
    ARRAY['Full-time'],
    'Experienced',
    'Graduate Degree',
    3,
    1,
    'active',
    NOW()
);

-- 18. Technical Support Team Leader
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Technical Support Team Leader',
    'Lead a team of technical support agents, provide technical guidance, and ensure high-quality technical support delivery.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    500000,
    620000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• 3-5 years of technical support experience\n• 1-2 years of team leadership experience\n• Graduate degree preferred\n• Strong technical knowledge\n• Leadership and coaching skills\n• Problem-solving abilities',
    'Senior',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Technical Training', 'Career Growth'],
    ARRAY['Technical Leadership', 'Team Management', 'Technical Support', 'Problem Solving', 'Coaching', 'Performance Management'],
    ARRAY['Full-time'],
    'Experienced',
    'Graduate Degree',
    3,
    1,
    'active',
    NOW()
);

-- 19. Quality Assurance Team Leader
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Quality Assurance Team Leader',
    'Lead the QA team, develop quality standards, monitor quality metrics, and implement process improvements.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Malad West, Mumbai"}',
    'Annual',
    460000,
    580000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• 3-5 years of QA experience\n• 1-2 years of team leadership experience\n• Graduate degree preferred\n• Strong analytical skills\n• Quality management expertise\n• Process improvement skills',
    'Senior',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'QA Training', 'Career Growth'],
    ARRAY['Quality Management', 'Team Leadership', 'Process Improvement', 'Analytical Skills', 'Performance Management', 'Coaching'],
    ARRAY['Full-time'],
    'Experienced',
    'Graduate Degree',
    3,
    1,
    'active',
    NOW()
);

-- 20. Operations Team Leader
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Operations Team Leader',
    'Lead overall operations team, manage multiple processes, ensure operational efficiency, and drive performance improvements.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Thane, Mumbai"}',
    'Annual',
    540000,
    680000,
    '3704be73-7409-4e2d-9f6b-1cf936b1a1a7',
    '• 4-6 years of BPO operations experience\n• 2-3 years of team leadership experience\n• Graduate degree preferred\n• Strong operational knowledge\n• Leadership and management skills\n• Strategic thinking abilities',
    'Senior',
    ARRAY['Health Insurance', 'Performance Bonus', 'Shift Allowance', 'Transportation', 'Meal Vouchers', 'Management Training', 'Career Growth'],
    ARRAY['Operations Management', 'Team Leadership', 'Strategic Planning', 'Performance Management', 'Process Optimization', 'Leadership'],
    ARRAY['Full-time'],
    'Experienced',
    'Graduate Degree',
    4,
    1,
    'active',
    NOW()
); 