import React from 'react';
import { useNavigate } from 'react-router-dom';
import MultiStepApplication from '../../components/MultiStepApplication';

const JobApplication: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <MultiStepApplication 
      type="job" 
      onClose={handleClose}
    />
  );
};

export default JobApplication; 