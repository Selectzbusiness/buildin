import React, { useState } from 'react';
import { supabase } from '../config/supabase';

interface AddInternshipFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddInternshipForm: React.FC<AddInternshipFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_id: '',
    location: '',
    type: '',
    duration: '',
    stipend: '',
    requirements: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('internships')
        .insert([
          {
            ...formData,
            status: 'active',
          }
        ])
        .select();

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        description: '',
        company_id: '',
        location: '',
        type: '',
        duration: '',
        stipend: '',
        requirements: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding the internship');
      console.error('Error adding internship:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Internship</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="e.g., Software Development Intern"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="Describe the internship role and responsibilities..."
          />
        </div>

        <div>
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
            Company ID
          </label>
          <input
            type="text"
            id="company_id"
            name="company_id"
            required
            value={formData.company_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="Enter company ID"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="e.g., Bangalore, India"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
          >
            <option value="">Select type</option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            required
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="e.g., 3 months"
          />
        </div>

        <div>
          <label htmlFor="stipend" className="block text-sm font-medium text-gray-700">
            Stipend
          </label>
          <input
            type="text"
            id="stipend"
            name="stipend"
            required
            value={formData.stipend}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="e.g., ₹25,000/month"
          />
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            required
            value={formData.requirements}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500"
            placeholder="List the requirements and qualifications..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-mint-600 hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Internship'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInternshipForm; 