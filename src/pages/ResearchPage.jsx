import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/research.css';

export default function ResearchPage() {
  const [patents, setPatents] = useState([]);
  const [scholarUrl, setScholarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'research')
      .single();

    if (!page) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('order_index');

    const patentList = [];
    data?.forEach(d => {
      if (d.type === 'patent') {
        patentList.push({ id: d.id, ...JSON.parse(d.value) });
      }
      if (d.type === 'scholar') {
        setScholarUrl(JSON.parse(d.value).url);
      }
    });

    setPatents(patentList);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="research-page">
        <div className="loading-state">Loading research information...</div>
      </div>
    );
  }

  return (
    <div className="research-page">
      <div className="research-header">
        <h1>Research & Patents</h1>
        <p className="research-intro">
          Advancing knowledge through academic research and innovative patent development
        </p>
      </div>

      {/* Research Papers Section */}
      <section className="research-section">
        <div className="section-title-wrapper">
          <h2>Research Publications</h2>
          <p className="section-description">
            Access my complete publication history, citations, and research metrics on Google Scholar
          </p>
        </div>

        {scholarUrl ? (
          <div className="scholar-container scholar-container--link-only">
            <a
              href={scholarUrl}
              target="_blank"
              rel="noreferrer"
              className="scholar-link"
            >
              Open Full Profile in Google Scholar →
            </a>
          </div>
        ) : (
          <div className="empty-state-section">
            <p>Research publications will be available soon.</p>
          </div>
        )}
      </section>

      {/* Patents Section */}
      <section className="research-section">
        <div className="section-title-wrapper">
          <h2>Patents</h2>
          <p className="section-description">
            Innovative solutions and technological contributions
          </p>
        </div>

        {patents.length > 0 ? (
          <div className="patent-grid">
            {patents.map(patent => (
              <article key={patent.id} className="patent-card">
                <div className="patent-card-header">
                  <h3>{patent.title}</h3>
                  {patent.year && (
                    <span className="patent-year">{patent.year}</span>
                  )}
                </div>

                {patent.description && (
                  <div className="patent-card-content">
                    <p>{patent.description}</p>
                  </div>
                )}

                {patent.pdf && (
                  <div className="patent-card-footer">
                    <a
                      href={patent.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="patent-pdf-link"
                    >
                      <span className="pdf-icon">📄</span>
                      View Patent Document
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-section">
            <p>Patent information will be available soon.</p>
          </div>
        )}
      </section>

      {/* Complete Empty State */}
      {!scholarUrl && patents.length === 0 && (
        <div className="empty-state-public">
          <p>Research and patent information will be available soon.</p>
        </div>
      )}
    </div>
  );
}