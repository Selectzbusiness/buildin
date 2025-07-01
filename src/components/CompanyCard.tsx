import React from 'react';

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-[#f4f8fb] p-4 rounded-xl border border-[#e3f0fa] shadow-lg hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200 flex flex-col items-center justify-center text-center" style={{ minHeight: '150px' }}>
      {company.logo_url ? (
        <img src={company.logo_url} alt={`${company.name} logo`} className="h-16 w-16 object-contain mb-2" />
      ) : (
        <div className="h-16 w-16 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-xl font-bold mb-2">
          {company.name.charAt(0).toUpperCase()}
        </div>
      )}
      <h3 className="text-md font-semibold text-gray-900 line-clamp-2">{company.name}</h3>
    </div>
  );
};

export default CompanyCard; 