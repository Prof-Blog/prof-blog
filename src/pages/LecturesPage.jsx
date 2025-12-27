import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/lectures.css';

export default function LecturesPage() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'lectures')
      .single();

    if (!page) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', page.id)
      .eq('type', 'lecture')
      .order('order_index', { ascending: false });

    const parsed = (data || []).map(d => ({
      id: d.id,
      ...JSON.parse(d.value)
    }));

    setLectures(parsed);
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

  if (loading) {
    return (
      <div className="lectures-page">
        <div className="loading-state">Loading lectures...</div>
      </div>
    );
  }

  return (
    <div className="lectures-page">
      <div className="lectures-header">
        <h1>Guest Lectures & Talks</h1>
        <p className="lectures-intro">
          Speaking engagements, invited talks, and knowledge-sharing initiatives at leading institutions and conferences
        </p>
      </div>

      {lectures.length === 0 ? (
        <div className="empty-state-public">
          <p>Speaking engagements and guest lectures will be listed here soon.</p>
        </div>
      ) : (
        <div className="lectures-grid">
          {lectures.map(lecture => (
            <article key={lecture.id} className="lecture-card">
              {lecture.image && (
                <div className="lecture-image-wrapper">
                  <img
                    src={lecture.image}
                    alt={lecture.title}
                    className="lecture-image"
                  />
                </div>
              )}

              <div className="lecture-content">
                <h3 className="lecture-title">{lecture.title}</h3>

                <div className="lecture-meta">
                  <div className="meta-row">
                    <span className="meta-item">
                      <span className="meta-icon">🏛️</span>
                      {lecture.institution || lecture.venue}
                    </span>
                  </div>
                  
                  <div className="meta-row">
                    {(lecture.location) && (
                      <span className="meta-item">
                        <span className="meta-icon">📍</span>
                        {lecture.location}
                      </span>
                    )}
                    <span className="meta-item">
                      <span className="meta-icon">📅</span>
                      {formatDate(lecture.date)}
                    </span>
                  </div>
                </div>

                {lecture.description && (
                  <p className="lecture-description">{lecture.description}</p>
                )}

                {lecture.pdf && (
                  <a
                    href={lecture.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="lecture-pdf-btn"
                  >
                    <span className="pdf-icon">📄</span>
                    View Materials
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}