import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/outreach.css';

export default function OutreachPage() {
  const [outreachItems, setOutreachItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutreach();
  }, []);

  const loadOutreach = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'outreach')
      .single();

    if (!page) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', page.id)
      .eq('type', 'outreach')
      .order('order_index', { ascending: false });

    const parsed = (data || []).map(d => ({
      id: d.id,
      ...JSON.parse(d.value)
    }));

    setOutreachItems(parsed);
    setLoading(false);
  };

  const formatDate = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group by category
  const groupedItems = outreachItems.reduce((acc, item) => {
    const cat = item.category || 'Others';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="outreach-page">
        <div className="loading-state">Loading outreach activities...</div>
      </div>
    );
  }

  return (
    <div className="outreach-page">
      <div className="outreach-header">
        <h1>Outreach Activities</h1>
        <p className="outreach-intro">
          Connecting with communities through educational programs, workshops, and collaborative initiatives that promote learning and social impact
        </p>
      </div>

      {outreachItems.length === 0 ? (
        <div className="empty-state-public">
          <p>Outreach activities will be listed here soon.</p>
        </div>
      ) : (
        <div className="outreach-categories">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="outreach-category-section">
              <h2 className="category-title">{category}</h2>
              
              <div className="outreach-accordion-list">
                {items.map(item => (
                  <div key={item.id} className="outreach-accordion-card">
                    <button
                      className="accordion-header"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="accordion-header-content">
                        <h3 className="accordion-title">{item.title}</h3>
                        {item.date && (
                          <span className="accordion-date">📅 {formatDate(item.date)}</span>
                        )}
                      </div>
                      <span className="accordion-icon">
                        {expandedId === item.id ? '−' : '+'}
                      </span>
                    </button>

                    {expandedId === item.id && (
                      <div className="accordion-body">
                        {item.image && (
                          <div className="accordion-image-wrapper">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="accordion-image"
                            />
                          </div>
                        )}

                        <p className="accordion-description">{item.description}</p>

                        {item.pdf && (
                          <a
                            href={item.pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="accordion-pdf-link"
                          >
                            <span className="pdf-icon">📄</span>
                            View Document
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}