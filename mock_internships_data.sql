-- Mock Internships Data for Mumbai IT Positions
-- Company ID: d215e89a-aac5-47cc-a43c-2b1766094e4c

-- 1. Software Development Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'Software Development Intern',
    'Join our development team as an intern and gain hands-on experience in building real-world applications. You will work on various projects using modern technologies and learn from experienced developers.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    '6 months',
    '{"amount": 25000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science or related field', 'Strong programming fundamentals', 'Knowledge of at least one programming language', 'Good problem-solving skills', 'Available for 6 months full-time'],
    ARRAY['Java', 'Python', 'JavaScript', 'Git', 'SQL', 'HTML', 'CSS'],
    ARRAY['Assist in developing web applications', 'Write clean and maintainable code', 'Participate in code reviews', 'Collaborate with team members', 'Learn new technologies and frameworks'],
    ARRAY['Certificate of completion', 'Letter of recommendation', 'Networking opportunities', 'Free lunch', 'Transport allowance', 'Learning resources'],
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '6 months',
    'active',
    NOW()
);

-- 2. Frontend Development Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'Frontend Development Intern',
    'Learn frontend development by working on real projects. You will gain experience with modern frameworks, responsive design, and user experience principles.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    '4 months',
    '{"amount": 20000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science or related field', 'Basic knowledge of HTML, CSS, and JavaScript', 'Understanding of web development concepts', 'Creative mindset and attention to detail', 'Available for 4 months full-time'],
    ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Bootstrap', 'Git', 'Responsive Design'],
    ARRAY['Develop responsive user interfaces', 'Implement design mockups', 'Optimize website performance', 'Work with design team', 'Learn modern frontend frameworks'],
    ARRAY['Certificate of completion', 'Portfolio projects', 'Mentorship from senior developers', 'Free lunch', 'Transport allowance', 'Design tools access'],
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '4 months',
    'active',
    NOW()
);

-- 3. Data Science Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'Data Science Intern',
    'Work with our data science team to analyze data, build models, and derive insights. This internship will give you hands-on experience with real-world data problems.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    '6 months',
    '{"amount": 30000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science, Statistics, or related field', 'Strong mathematical and statistical background', 'Basic knowledge of Python or R', 'Interest in machine learning', 'Available for 6 months full-time'],
    ARRAY['Python', 'R', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Machine Learning'],
    ARRAY['Analyze large datasets', 'Build predictive models', 'Create data visualizations', 'Write research reports', 'Collaborate with data engineers'],
    ARRAY['Certificate of completion', 'Research publication opportunities', 'Access to premium datasets', 'Free lunch', 'Transport allowance', 'Conference attendance'],
    NOW() + INTERVAL '35 days',
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '6 months',
    'active',
    NOW()
);

-- 4. DevOps Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'DevOps Intern',
    'Learn about cloud infrastructure, CI/CD pipelines, and deployment automation. This internship will give you practical experience with modern DevOps tools and practices.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    '5 months',
    '{"amount": 28000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science or related field', 'Basic knowledge of Linux systems', 'Understanding of networking concepts', 'Interest in cloud technologies', 'Available for 5 months full-time'],
    ARRAY['Linux', 'Docker', 'AWS', 'Git', 'Bash', 'Jenkins', 'Kubernetes'],
    ARRAY['Assist in setting up CI/CD pipelines', 'Manage cloud infrastructure', 'Monitor system performance', 'Automate deployment processes', 'Learn containerization technologies'],
    ARRAY['Certificate of completion', 'AWS certification voucher', 'Hands-on cloud experience', 'Free lunch', 'Transport allowance', 'Premium tools access'],
    NOW() + INTERVAL '28 days',
    NOW() + INTERVAL '12 days',
    NOW() + INTERVAL '5 months',
    'active',
    NOW()
);

-- 5. Mobile App Development Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'Mobile App Development Intern',
    'Work on developing mobile applications for iOS and Android platforms. Learn React Native and gain experience in cross-platform mobile development.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    '4 months',
    '{"amount": 22000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science or related field', 'Basic knowledge of JavaScript', 'Understanding of mobile app concepts', 'Interest in mobile development', 'Available for 4 months full-time'],
    ARRAY['JavaScript', 'React Native', 'Expo', 'Git', 'Mobile UI/UX', 'Firebase', 'App Store'],
    ARRAY['Develop mobile applications', 'Implement UI components', 'Integrate APIs and services', 'Test apps on different devices', 'Learn app store deployment'],
    ARRAY['Certificate of completion', 'Published app in portfolio', 'Device testing access', 'Free lunch', 'Transport allowance', 'App store developer account'],
    NOW() + INTERVAL '22 days',
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '4 months',
    'active',
    NOW()
);

-- 6. QA Testing Intern
INSERT INTO internships (
    company_id, title, description, type, location, duration, stipend,
    requirements, skills, responsibilities, perks, application_deadline,
    start_date, end_date, status, created_at
) VALUES (
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'QA Testing Intern',
    'Learn software testing methodologies and tools. Work with our QA team to ensure software quality through manual and automated testing.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    '3 months',
    '{"amount": 18000, "currency": "INR", "type": "monthly"}',
    ARRAY['Currently pursuing B.Tech/B.E. in Computer Science or related field', 'Strong attention to detail', 'Good analytical skills', 'Basic knowledge of testing concepts', 'Available for 3 months full-time'],
    ARRAY['Manual Testing', 'Selenium', 'JIRA', 'Postman', 'Test Cases', 'Bug Reporting', 'Agile'],
    ARRAY['Write and execute test cases', 'Perform manual testing', 'Report and track bugs', 'Learn automated testing tools', 'Participate in testing processes'],
    ARRAY['Certificate of completion', 'Testing tools certification', 'Quality assurance experience', 'Free lunch', 'Transport allowance', 'Testing tools access'],
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '3 months',
    'active',
    NOW()
); 