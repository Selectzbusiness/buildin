import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MultiStepApplication from '../../components/MultiStepApplication';
import ApplicationStatusTracker from '../../components/ApplicationStatusTracker';

const JobApplication: React.FC = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div>
      <MultiStepApplication 
        type="job" 
        onClose={handleClose}
      />
      {applicationId && <ApplicationStatusTracker applicationId={applicationId} />}
    </div>
  );
};

export default JobApplication; 