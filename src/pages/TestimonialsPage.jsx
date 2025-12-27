import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/testimonials.css';

export default function TestimonialsPage() {
  const [openId, setOpenId] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: page } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', 'testimonials')
        .single();

      const { data } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .eq('type', 'testimonial')
        .order('order_index');

      setItems(
        (data || []).map(d => ({ id: d.id, ...JSON.parse(d.value) }))
      );
    };

    load();
  }, []);

  const grouped = items.reduce((acc, t) => {
    const cat = t.category || 'Others';
    acc[cat] = acc[cat] || [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="testimonials-page">
      <div className="testimonials-container">
        <header className="testimonials-header">
          <h1>Testimonials & Appreciation Letters</h1>
          <p>Collection of recognition and feedback documents</p>
        </header>

        {Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="testimonials-category">
            <h2 className="category-title">{cat}</h2>
            <div className="testimonials-grid">
              {list.map(t => (
                <div key={t.id} className="testimonial-card">
                  <div className="testimonial-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="testimonial-content">
                    <h3 className="testimonial-title">{t.title}</h3>
                    {t.date && (
                      <p className="testimonial-date">
                        {new Date(t.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    className="view-pdf-btn"
                    onClick={() => window.open(t.pdf, '_blank')}
                  >
                    View PDF
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {items.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>No testimonials available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}