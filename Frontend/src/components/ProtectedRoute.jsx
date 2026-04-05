import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, accessToken } = useSelector((state) => state.auth);
    const location = useLocation();

    if (!accessToken || !user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // eslint-disable-next-line react/prop-types
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If the user's role is not allowed, redirect to a safe page (e.g., home or explicit unauthorized page)
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
