import ChatPage from './ChatPage.jsx';
import PrReviewPage from './PrReviewPage.jsx';

export default function App() {
  return window.location.pathname === '/pr-review' ? <PrReviewPage /> : <ChatPage />;
}
