import React from 'react';
import { ViewState } from '../../types';
import HomePage from '../../landingpage';

interface LandingPageProps {
  setView: (view: ViewState) => void;
}

/**
 * Trang giới thiệu / landing — nội dung thực tế nằm ở `landingpage.jsx` (root).
 * Trước đây file này chứa bản UI indigo cũ; giờ re-export bản trang chủ mới để App luôn hiển thị đúng.
 */
const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  return <HomePage setView={setView} />;
};

export default LandingPage;
