import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Internships from '../pages/Internships';
import InternshipDetails from '../pages/InternshipDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Logout from '../pages/Logout';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import StudentExplore from '../pages/student/StudentExplore';
import StudentResumes from '../pages/student/StudentResumes';
import StudentMatches from '../pages/student/StudentMatches';
import StudentProfile from '../pages/student/StudentProfile';
import StudentNotifications from '../pages/student/StudentNotifications';
import StudentApplications from '../pages/student/StudentApplications';

const AppRouter = () => {
  const { user } = useAuth();

  const homeRouteElement = user?.role === 'recruiter'
    ? <Navigate to="/dashboard/recruiter" replace />
    : <Home />;

  return (
    <Routes>
      <Route path="/" element={homeRouteElement} />
      <Route path="/internships" element={<Internships />} />
      <Route path="/internships/:listingId" element={<InternshipDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/logout" element={<Logout />} />

      <Route
        path="/dashboard/student"
        element={<Navigate to="/student/matches" replace />}
      />

      <Route
        path="/student"
        element={(
          <ProtectedRoute role="student">
            <Navigate to="/student/matches" replace />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/explore"
        element={(
          <ProtectedRoute role="student">
            <StudentExplore />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/resumes"
        element={(
          <ProtectedRoute role="student">
            <StudentResumes />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/applications"
        element={(
          <ProtectedRoute role="student">
            <StudentApplications />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/matches"
        element={(
          <ProtectedRoute role="student">
            <StudentMatches />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/profile"
        element={(
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student/notifications"
        element={(
          <ProtectedRoute role="student">
            <StudentNotifications />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/dashboard/recruiter"
        element={(
          <ProtectedRoute role="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
};

export default AppRouter;
