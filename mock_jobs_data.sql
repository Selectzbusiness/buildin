-- Mock Jobs Data for Mumbai IT Positions
-- Company ID: d215e89a-aac5-47cc-a43c-2b1766094e4c

-- 1. Senior Software Engineer - Full Stack
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Senior Software Engineer - Full Stack',
    'We are looking for a Senior Full Stack Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies. You will work closely with product managers, designers, and other engineers to deliver high-quality software solutions.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    'Annual',
    1800000,
    2500000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 5+ years of experience in full-stack development\n• Strong proficiency in JavaScript, TypeScript, React, Node.js\n• Experience with databases (PostgreSQL, MongoDB)\n• Knowledge of cloud platforms (AWS, Azure)\n• Experience with microservices architecture\n• Strong problem-solving and communication skills',
    'Senior',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Gym Membership'],
    ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Git'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    5,
    2,
    'active',
    NOW()
);

-- 2. DevOps Engineer
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'DevOps Engineer',
    'Join our DevOps team to build and maintain our cloud infrastructure. You will be responsible for implementing CI/CD pipelines, managing cloud resources, and ensuring high availability of our services. This role requires strong automation skills and experience with modern DevOps tools.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    'Annual',
    1500000,
    2200000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 3+ years of experience in DevOps or SRE roles\n• Strong knowledge of AWS, Azure, or GCP\n• Experience with Docker, Kubernetes, and containerization\n• Proficiency in scripting languages (Python, Bash)\n• Experience with CI/CD tools (Jenkins, GitLab CI)\n• Knowledge of monitoring and logging tools',
    'Mid-level',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Free Lunch'],
    ARRAY['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Python', 'Bash', 'Terraform', 'Prometheus'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    3,
    1,
    'active',
    NOW()
);

-- 3. Data Scientist
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Data Scientist',
    'We are seeking a Data Scientist to analyze complex data sets and develop machine learning models. You will work on predictive analytics, recommendation systems, and data-driven insights to help drive business decisions. This role requires strong statistical and programming skills.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    'Annual',
    2000000,
    3000000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 4+ years of experience in data science or machine learning\n• Strong programming skills in Python and R\n• Experience with ML frameworks (TensorFlow, PyTorch, scikit-learn)\n• Knowledge of SQL and big data technologies\n• Experience with statistical analysis and A/B testing\n• Strong communication and presentation skills',
    'Senior',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Conference Allowance'],
    ARRAY['Python', 'R', 'TensorFlow', 'PyTorch', 'scikit-learn', 'SQL', 'Pandas', 'NumPy'],
    ARRAY['Full-time'],
    'Experienced',
    'Master''s Degree in Statistics, Computer Science, or related field',
    4,
    1,
    'active',
    NOW()
);

-- 4. Frontend Developer
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Frontend Developer',
    'Join our frontend team to create beautiful and responsive user interfaces. You will work with modern frameworks and tools to build engaging web applications. This role requires strong attention to detail and passion for creating excellent user experiences.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    'Annual',
    1200000,
    1800000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 3+ years of experience in frontend development\n• Strong proficiency in HTML, CSS, JavaScript\n• Experience with React, Vue.js, or Angular\n• Knowledge of responsive design principles\n• Experience with build tools (Webpack, Vite)\n• Understanding of web accessibility standards',
    'Mid-level',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Design Tools License'],
    ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'Webpack', 'Sass', 'TypeScript'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    3,
    2,
    'active',
    NOW()
);

-- 5. Backend Developer
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Backend Developer',
    'We are looking for a Backend Developer to build robust and scalable server-side applications. You will work on API development, database design, and system architecture. This role requires strong problem-solving skills and experience with backend technologies.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    'Annual',
    1400000,
    2000000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 3+ years of experience in backend development\n• Strong programming skills in Java, Python, or Node.js\n• Experience with databases (PostgreSQL, MySQL, MongoDB)\n• Knowledge of RESTful APIs and microservices\n• Experience with cloud platforms and deployment\n• Understanding of security best practices',
    'Mid-level',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Gym Membership'],
    ARRAY['Java', 'Python', 'Node.js', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'AWS'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    3,
    1,
    'active',
    NOW()
);

-- 6. Mobile App Developer (React Native)
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Mobile App Developer - React Native',
    'Join our mobile development team to create cross-platform mobile applications. You will work with React Native to build high-performance apps for both iOS and Android platforms. This role requires strong mobile development skills and attention to user experience.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    'Annual',
    1600000,
    2400000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 4+ years of experience in mobile app development\n• Strong proficiency in React Native and JavaScript\n• Experience with iOS and Android development\n• Knowledge of mobile app architecture patterns\n• Experience with app store deployment\n• Understanding of mobile UI/UX principles',
    'Senior',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Device Allowance'],
    ARRAY['React Native', 'JavaScript', 'TypeScript', 'Redux', 'iOS', 'Android', 'Firebase', 'Git'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    4,
    1,
    'active',
    NOW()
);

-- 7. QA Engineer
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'QA Engineer',
    'We are seeking a QA Engineer to ensure the quality of our software products. You will design and execute test plans, automate testing processes, and work closely with development teams to identify and resolve issues. This role requires strong analytical and testing skills.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    'Annual',
    1000000,
    1500000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 3+ years of experience in software testing\n• Strong knowledge of testing methodologies and tools\n• Experience with automated testing frameworks (Selenium, Cypress)\n• Knowledge of API testing and performance testing\n• Experience with bug tracking tools\n• Strong attention to detail and analytical skills',
    'Mid-level',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Testing Tools License'],
    ARRAY['Selenium', 'Cypress', 'Postman', 'JIRA', 'Python', 'JavaScript', 'JMeter', 'Git'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    3,
    1,
    'active',
    NOW()
);

-- 8. Product Manager
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Product Manager',
    'Join our product team to drive the development of innovative software products. You will work with cross-functional teams to define product strategy, prioritize features, and ensure successful product launches. This role requires strong leadership and communication skills.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    'Annual',
    2500000,
    3500000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 5+ years of experience in product management\n• Strong understanding of software development lifecycle\n• Experience with agile methodologies and tools\n• Excellent communication and stakeholder management skills\n• Data-driven decision making abilities\n• Experience with user research and market analysis',
    'Senior',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Conference Allowance'],
    ARRAY['Product Strategy', 'Agile', 'Scrum', 'JIRA', 'Analytics', 'User Research', 'Market Analysis', 'Leadership'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Business, Computer Science, or related field',
    5,
    1,
    'active',
    NOW()
);

-- 9. UI/UX Designer
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'UI/UX Designer',
    'We are looking for a creative UI/UX Designer to create intuitive and engaging user experiences. You will work on user research, wireframing, prototyping, and visual design. This role requires strong design skills and understanding of user-centered design principles.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Andheri West, Mumbai"}',
    'Annual',
    1200000,
    1800000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 4+ years of experience in UI/UX design\n• Strong portfolio showcasing web and mobile designs\n• Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)\n• Experience with user research and usability testing\n• Knowledge of design systems and component libraries\n• Understanding of accessibility and responsive design',
    'Mid-level',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Design Tools License'],
    ARRAY['Figma', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility', 'Responsive Design'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Design, Fine Arts, or related field',
    4,
    1,
    'active',
    NOW()
);

-- 10. Technical Lead
INSERT INTO jobs (
    title, description, job_type, location, pay_type, min_amount, max_amount, 
    company_id, requirements, experience_level, benefits, skills, 
    employment_types, experience_type, minimum_education, minimum_experience,
    openings, status, created_at
) VALUES (
    'Technical Lead',
    'Join our engineering team as a Technical Lead to guide technical decisions and mentor junior developers. You will be responsible for architecture design, code reviews, and ensuring high code quality standards. This role requires strong technical leadership and communication skills.',
    'Full-time',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "address": "Powai, Mumbai"}',
    'Annual',
    3000000,
    4500000,
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    '• 7+ years of experience in software development\n• Strong technical leadership and mentoring skills\n• Experience with system architecture and design patterns\n• Proficiency in multiple programming languages\n• Experience with cloud platforms and microservices\n• Excellent communication and team collaboration skills',
    'Senior',
    ARRAY['Health Insurance', 'Flexible Working Hours', 'Remote Work Options', 'Performance Bonus', 'Learning Budget', 'Conference Allowance', 'Stock Options'],
    ARRAY['System Architecture', 'Design Patterns', 'Microservices', 'Cloud Platforms', 'Leadership', 'Mentoring', 'Code Review', 'Agile'],
    ARRAY['Full-time'],
    'Experienced',
    'Bachelor''s Degree in Computer Science or related field',
    7,
    1,
    'active',
    NOW()
); 