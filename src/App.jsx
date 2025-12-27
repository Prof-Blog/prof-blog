import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

import DynamicPage from './pages/DynamicPage';
import AdminPage from './pages/AdminPage';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import OutreachPage from './pages/OutreachPage';
import AdminOutreach from './pages/AdminOutreach';
import ResearchPage from './pages/ResearchPage';
import AdminResearch from './pages/AdminResearch';
import LecturesPage from './pages/LecturesPage';
import AdminLectures from './pages/AdminLectures';
import AwardsPage from './pages/AwardsPage';
import TestimonialsPage from './pages/TestimonialsPage';

import AdminAwards from './pages/AdminAwards';
import AdminTestimonials from './pages/AdminTestimonials';


function App() {
  const [pages, setPages] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch pages for navigation
  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .then(({ data }) => {
        setPages(data || []);
      });
  }, []);

  // Track auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* REAL NAVBAR */}
      <Navbar
        pages={pages}
        user={user}
        onLogout={async () => {
          await supabase.auth.signOut();
        }}
      />

      <Routes>
  {/* HOME */}
  <Route path="/" element={<DynamicPage isHome />} />

  {/* PUBLIC SPECIAL PAGES */}
  <Route path="/outreach" element={<OutreachPage />} />
  <Route path="/research" element={<ResearchPage />} />
  <Route path="/lectures" element={<LecturesPage />} />
  <Route path="/awards" element={<AwardsPage />} />
  <Route path="/testimonials" element={<TestimonialsPage />} />

  {/* ADMIN SPECIAL PAGES */}
  <Route
    path="/admin/outreach"
    element={user ? <AdminOutreach /> : <Login />}
  />
  <Route
    path="/admin/research"
    element={user ? <AdminResearch /> : <Login />}
  />
  <Route
    path="/admin/lectures"
    element={user ? <AdminLectures /> : <Login />}
  />
  <Route
    path="/admin/awards"
    element={user ? <AdminAwards /> : <Login />}
  />
  <Route
    path="/admin/testimonials"
    element={user ? <AdminTestimonials /> : <Login />}
  />

  {/* GENERIC ADMIN CMS */}
  <Route
    path="/admin/:slug"
    element={user ? <AdminPage /> : <Login />}
  />

  {/* GENERIC PUBLIC CMS (KEEP LAST) */}
  <Route path="/:slug" element={<DynamicPage />} />
</Routes>

    </>
  );
}

export default App;
