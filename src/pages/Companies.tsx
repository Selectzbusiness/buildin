import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  size: string;
  description: string;
  openPositions: number;
}

const CompaniesAdmin: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.roles?.includes('admin');

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, website, description, is_featured');
      if (error) setError(error.message);
      setCompanies(data || []);
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  const handleToggleFeatured = async (companyId: string, current: boolean) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_featured: !current })
      .eq('id', companyId);
    if (!error) {
      setCompanies(companies => companies.map(c => c.id === companyId ? { ...c, is_featured: !current } : c));
    } else {
      alert('Failed to update featured status: ' + error.message);
    }
  };

  if (!isAdmin) return <div className="p-8 text-center text-red-600 font-bold">You do not have access to this page.</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Company Management (Admin Only)</h1>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <div className="space-y-4">
          {companies.map(company => (
            <div key={company.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-100">
              {company.logo_url && <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />}
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{company.name}</div>
                <div className="text-gray-500 text-xs line-clamp-1">{company.description}</div>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{company.website.replace(/^https?:\/\//, '')}</a>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!company.is_featured}
                  onChange={() => handleToggleFeatured(company.id, !!company.is_featured)}
                  disabled={loading}
                />
                <span className="text-sm">Featured</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompaniesAdmin; 