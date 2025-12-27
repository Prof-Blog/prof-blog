import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/awards.css';

export default function AwardsPage() {
  const [awards, setAwards] = useState([]);
  const [selectedAward, setSelectedAward] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: page } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', 'awards')
        .single();

      const { data } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .eq('type', 'award')
        .order('order_index');

      setAwards(
        (data || []).map(d => ({ id: d.id, ...JSON.parse(d.value) }))
      );
    };

    load();
  }, []);

  return (
    <div className="awards-page">
      <div className="awards-container">
        <header className="awards-header">
          <h1>Awards & Recognition</h1>
          <p>Honors and achievements in teaching and research excellence</p>
        </header>

        <div className="awards-grid">
          {awards.map(award => (
            <div 
              key={award.id} 
              className="award-card"
              onClick={() => setSelectedAward(award)}
            >
              <div className="award-visual">
                {award.image ? (
                  <img src={award.image} alt={award.title} className="award-image" />
                ) : (
                  <div className="award-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="award-content">
                <div className="award-meta">
                  {award.year && <span className="award-year">{award.year}</span>}
                  {award.body && <span className="award-body">{award.body}</span>}
                </div>
                <h3 className="award-title">{award.title}</h3>
                {award.context && (
                  <p className="award-context">{award.context}</p>
                )}
              </div>

              {award.pdf && (
                <button 
                  className="view-certificate-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(award.pdf, '_blank');
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  View Certificate
                </button>
              )}
            </div>
          ))}
        </div>

        {awards.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <p>No awards available yet</p>
          </div>
        )}

        {selectedAward && (
          <div className="award-modal" onClick={() => setSelectedAward(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedAward(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              
              {selectedAward.image && (
                <div className="modal-image">
                  <img src={selectedAward.image} alt={selectedAward.title} />
                </div>
              )}
              
              <div className="modal-details">
                <div className="modal-meta">
                  {selectedAward.year && <span className="modal-year">{selectedAward.year}</span>}
                  {selectedAward.body && <span className="modal-body">{selectedAward.body}</span>}
                </div>
                <h2>{selectedAward.title}</h2>
                {selectedAward.context && <p>{selectedAward.context}</p>}
                
                {selectedAward.pdf && (
                  <button 
                    className="modal-pdf-btn"
                    onClick={() => window.open(selectedAward.pdf, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    View Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}