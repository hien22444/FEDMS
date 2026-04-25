import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

const Guidelines = () => {
  return <Navigate to={ROUTES.STUDENT_DORM_RULES} replace />;
};

export default Guidelines;
