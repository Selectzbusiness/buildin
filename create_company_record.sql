-- Create company record for the jobs
-- This company record is needed before inserting jobs

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
    'd215e89a-aac5-47cc-a43c-2b1766094e4c',
    'TechCorp Solutions',
    'A leading technology company specializing in innovative software solutions for businesses worldwide. We focus on creating cutting-edge applications that drive digital transformation.',
    'Technology',
    '500-1000 employees',
    'Mumbai, Maharashtra, India',
    'https://techcorp-solutions.com',
    2015,
    'Private Limited',
    'We foster a collaborative and innovative culture where creativity meets technology. Our team values continuous learning, work-life balance, and making a positive impact through technology.',
    'Comprehensive health insurance, flexible working hours, remote work options, performance bonuses, learning and development budget, gym memberships, free lunch, conference allowances, and stock options for senior positions.',
    'TechCorp Solutions is a dynamic technology company founded in 2015 with a mission to transform businesses through innovative software solutions. We have grown from a small startup to a team of over 800 professionals, serving clients across various industries including finance, healthcare, e-commerce, and manufacturing. Our expertise spans full-stack development, cloud solutions, data analytics, and mobile applications.',
    NOW(),
    NOW()
); 