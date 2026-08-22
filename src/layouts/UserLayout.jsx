import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import CategoryNavBar from '../components/layout/CategoryNavBar';
import Footer from '../components/layout/Footer';
import ChatAssistant from '../components/layout/ChatAssistant';
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';

const UserLayout = () => {
  const location = useLocation();
  useBehaviorTracker(); // Kích hoạt tự động tracking page_view toàn trang user

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CategoryNavBar />
      <main className="flex-1 pt-[108px] lg:pt-[112px]">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <ChatAssistant />
      <Footer />
    </div>
  );
};

export default UserLayout;
