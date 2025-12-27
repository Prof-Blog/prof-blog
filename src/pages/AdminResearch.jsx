import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/page.css';
import '../styles/research.css';

export default function AdminResearch() {
  const [pageId, setPageId] = useState(null);
  const [patents, setPatents] = useState([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [pdf, setPdf] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [scholarUrl, setScholarUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'research')
      .single();

    if (!page) return;
    setPageId(page.id);

    const { data } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('order_index');

    const patentList = [];
    data.forEach(d => {
      if (d.type === 'patent') {
        patentList.push({ id: d.id, ...JSON.parse(d.value) });
      }
      if (d.type === 'scholar') {
        setScholarUrl(JSON.parse(d.value).url);
      }
    });

    setPatents(patentList);
  };

  /* ---------- PATENT CRUD ---------- */

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Patent title is required');
      return;
    }

    let pdfUrl = null;

    if (pdf) {
      const name = `patent-${Date.now()}-${pdf.name}`;
      await supabase.storage.from('patent-pdfs').upload(name, pdf, { upsert: true });
      pdfUrl = supabase.storage.from('patent-pdfs').getPublicUrl(name).data.publicUrl;
    }

    const value = {
      title: title.trim(),
      description: description.trim(),
      year: year.trim() || null,
      pdf: pdfUrl
    };

    if (editingId) {
      // Update existing patent
      await supabase
        .from('content_blocks')
        .update({ value: JSON.stringify(value) })
        .eq('id', editingId);
    } else {
      // Add new patent
      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'patent',
        value: JSON.stringify(value),
        order_index: Date.now()
      });
    }

    resetForm();
    loadData();
  };

  const editPatent = patent => {
    setTitle(patent.title);
    setDescription(patent.description || '');
    setYear(patent.year || '');
    setEditingId(patent.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePatent = async id => {
    if (!window.confirm('Are you sure you want to delete this patent?')) {
      return;
    }

    await supabase.from('content_blocks').delete().eq('id', id);
    setPatents(patents.filter(p => p.id !== id));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setYear('');
    setPdf(null);
    setEditingId(null);
  };

  /* ---------- SCHOLAR ---------- */

  const saveScholar = async () => {
    await supabase
      .from('content_blocks')
      .delete()
      .eq('page_id', pageId)
      .eq('type', 'scholar');

    if (scholarUrl.trim()) {
      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'scholar',
        value: JSON.stringify({ url: scholarUrl.trim() }),
        order_index: 0
      });
    }

    alert('Scholar link updated successfully');
  };

  return (
    <div className="admin-research-container">
      <div className="admin-research-header">
        <h1>Research & Patents Management</h1>
        <p className="admin-subtitle">Manage Google Scholar profile and patent portfolio</p>
      </div>

      {/* Google Scholar Section */}
      <section className="admin-section">
        <div className="section-header">
          <h2>Google Scholar Profile</h2>
        </div>
        <div className="form-card">
          <div className="form-group">
            <label htmlFor="scholar-url">Scholar Profile URL</label>
            <input
              id="scholar-url"
              type="url"
              placeholder="https://scholar.google.com/citations?user=..."
              value={scholarUrl}
              onChange={e => setScholarUrl(e.target.value)}
              className="form-input"
            />
            <small className="form-hint">All research papers will be displayed via Google Scholar</small>
          </div>
          <button onClick={saveScholar} className="btn btn-primary">
            Save Scholar Link
          </button>
        </div>
      </section>

      {/* Add/Edit Patent Form */}
      <section className="admin-section">
        <div className="section-header">
          <h2>{editingId ? 'Edit Patent' : 'Add Patent'}</h2>
        </div>
        <div className="form-card">
          <div className="form-group">
            <label htmlFor="patent-title">Patent Title *</label>
            <input
              id="patent-title"
              type="text"
              placeholder="e.g., Method and System for Real-Time Data Processing"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patent-description">Patent Description</label>
            <textarea
              id="patent-description"
              placeholder="Provide a brief description of the patent, its innovations, and applications..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patent-year">Year</label>
            <input
              id="patent-year"
              type="text"
              placeholder="e.g., 2024"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patent-pdf">Patent Document (PDF)</label>
            <input
              id="patent-pdf"
              type="file"
              accept="application/pdf"
              onChange={e => setPdf(e.target.files[0])}
              className="form-file"
            />
            <small className="form-hint">Optional: Upload the official patent document</small>
          </div>

          <div className="form-actions">
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingId ? 'Update Patent' : 'Add Patent'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Existing Patents */}
      <section className="admin-section">
        <div className="section-header">
          <h2>Existing Patents</h2>
          <span className="entry-count">{patents.length} patents</span>
        </div>

        {patents.length === 0 ? (
          <div className="empty-state">
            <p>No patents yet. Add your first patent above.</p>
          </div>
        ) : (
          <div className="research-list">
            {patents.map(patent => (
              <div key={patent.id} className="research-card">
                <div className="research-card-header">
                  <div>
                    <h3>{patent.title}</h3>
                    {patent.year && <span className="patent-year-badge">{patent.year}</span>}
                  </div>
                  {patent.pdf && (
                    <span className="pdf-badge">PDF Attached</span>
                  )}
                </div>
                {patent.description && (
                  <p className="research-summary-preview">
                    {patent.description.length > 200
                      ? `${patent.description.substring(0, 200)}...`
                      : patent.description}
                  </p>
                )}
                <div className="research-card-actions">
                  {patent.pdf && (
                    <a
                      href={patent.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-link"
                    >
                      View PDF
                    </a>
                  )}
                  <button
                    onClick={() => editPatent(patent)}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePatent(patent.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}