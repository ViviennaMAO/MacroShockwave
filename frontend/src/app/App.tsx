import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage as Home } from '@/pages/HomePage';
import { EventDetailPage as EventDetail } from '@/pages/EventDetailPage';
import { PortfolioPage as Portfolio } from '@/pages/PortfolioPage';
import { ProfilePage as Profile } from '@/pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="event/:id" element={<EventDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
