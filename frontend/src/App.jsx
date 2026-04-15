import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PageLoader from './components/PageLoader';

const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Landing = lazy(() => import('./pages/Landing'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const Matches = lazy(() => import('./pages/Matches'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Admin = lazy(() => import('./pages/Admin'));
const Search = lazy(() => import('./pages/Search'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const VerifyEmailRequired = lazy(() => import('./pages/VerifyEmailRequired'));

const Protected = ({ children }) => {
  const { user, loading, isEmailVerified } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isEmailVerified) return <Navigate to="/verify-email-required" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!['admin', 'root'].includes(user?.role)) return <Navigate to="/home" replace />;
  return children;
};

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-required" element={<VerifyEmailRequired />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Protected><Layout /></Protected>}>
          <Route index element={<Home />} />
          <Route path="discover" element={<Discover />} />
          <Route path="search" element={<Search />} />
          <Route path="matches" element={<Matches />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:matchId" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="post/:postId" element={<PostDetail />} />
          <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Route>
        <Route path="/profile" element={<Protected><Navigate to="/home" replace /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
