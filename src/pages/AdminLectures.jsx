import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/page.css';
import '../styles/lectures.css';

export default function AdminLectures() {
  const [pageId, setPageId] = useState(null);
  const [lectures, setLectures] = useState([]);

  // Form state
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'lectures')
      .single();

    if (!page) return;
    setPageId(page.id);

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
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Talk/Lecture title is required');
      return;
    }
    if (!institution.trim()) {
      alert('Event/Institution name is required');
      return;
    }
    if (!date) {
      alert('Date is required');
      return;
    }

    let imageUrl = null;
    let pdfUrl = null;

    if (image) {
      const imgName = `lecture-img-${Date.now()}-${image.name}`;
      await supabase.storage
        .from('images')
        .upload(imgName, image, { upsert: true });

      imageUrl = supabase.storage
        .from('images')
        .getPublicUrl(imgName).data.publicUrl;
    }

    if (pdf) {
      const pdfName = `lecture-pdf-${Date.now()}-${pdf.name}`;
      await supabase.storage
        .from('pdfs')
        .upload(pdfName, pdf, { upsert: true });

      pdfUrl = supabase.storage
        .from('pdfs')
        .getPublicUrl(pdfName).data.publicUrl;
    }

    const value = {
      title: title.trim(),
      institution: institution.trim(),
      location: location.trim() || null,
      date,
      description: description.trim() || null,
      image: imageUrl,
      pdf: pdfUrl
    };

    if (editingId) {
      // Update existing lecture
      await supabase
        .from('content_blocks')
        .update({ value: JSON.stringify(value) })
        .eq('id', editingId);
    } else {
      // Add new lecture
      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'lecture',
        value: JSON.stringify(value),
        order_index: Date.now()
      });
    }

    resetForm();
    loadData();
  };

  const editLecture = lecture => {
    setTitle(lecture.title);
    setInstitution(lecture.institution || lecture.venue || '');
    setLocation(lecture.location || '');
    setDate(lecture.date || '');
    setDescription(lecture.description || '');
    setEditingId(lecture.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteLecture = async id => {
    if (!window.confirm('Are you sure you want to delete this lecture/talk?')) {
      return;
    }

    await supabase.from('content_blocks').delete().eq('id', id);
    setLectures(lectures.filter(l => l.id !== id));
  };

  const resetForm = () => {
    setTitle('');
    setInstitution('');
    setLocation('');
    setDate('');
    setDescription('');
    setImage(null);
    setPdf(null);
    setEditingId(null);
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

  return (
    <div className="admin-lectures-container">
      <div className="admin-lectures-header">
        <h1>Guest Lectures & Talks Management</h1>
        <p className="admin-subtitle">Manage speaking engagements, invited talks, and guest lectures</p>
      </div>

      {/* Add/Edit Form */}
      <section className="admin-section">
        <div className="section-header">
          <h2>{editingId ? 'Edit Lecture/Talk' : 'Add Lecture/Talk'}</h2>
        </div>
        <div className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lecture-title">Talk / Lecture Title *</label>
              <input
                id="lecture-title"
                type="text"
                placeholder="e.g., AI in Healthcare: Opportunities and Challenges"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lecture-institution">Event / Institution Name *</label>
              <input
                id="lecture-institution"
                type="text"
                placeholder="e.g., Stanford University, TEDx Conference"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lecture-location">Location</label>
              <input
                id="lecture-location"
                type="text"
                placeholder="e.g., Stanford, CA or Virtual"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lecture-date">Date *</label>
              <input
                id="lecture-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lecture-description">Description / Abstract</label>
            <textarea
              id="lecture-description"
              placeholder="Provide a brief description of the talk, key topics covered, or abstract..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lecture-image">Event Image</label>
              <input
                id="lecture-image"
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files[0])}
                className="form-file"
              />
              <small className="form-hint">Optional: Photo from the event or venue</small>
            </div>

            <div className="form-group">
              <label htmlFor="lecture-pdf">Supporting Document (PDF)</label>
              <input
                id="lecture-pdf"
                type="file"
                accept="application/pdf"
                onChange={e => setPdf(e.target.files[0])}
                className="form-file"
              />
              <small className="form-hint">Optional: Invitation letter, brochure, or slides</small>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingId ? 'Update Talk' : 'Add Talk'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Existing Lectures List */}
      <section className="admin-section">
        <div className="section-header">
          <h2>Existing Lectures & Talks</h2>
          <span className="entry-count">{lectures.length} entries</span>
        </div>

        {lectures.length === 0 ? (
          <div className="empty-state">
            <p>No lectures or talks yet. Add your first speaking engagement above.</p>
          </div>
        ) : (
          <div className="lectures-admin-list">
            {lectures.map(lecture => (
              <div key={lecture.id} className="lecture-admin-card">
                <div className="lecture-admin-main">
                  {lecture.image && (
                    <div className="lecture-thumbnail">
                      <img src={lecture.image} alt={lecture.title} />
                    </div>
                  )}
                  
                  <div className="lecture-admin-info">
                    <h3>{lecture.title}</h3>
                    
                    <div className="lecture-metadata">
                      <span className="metadata-item">
                        <strong>📍</strong> {lecture.institution || lecture.venue}
                      </span>
                      {(lecture.location) && (
                        <span className="metadata-item">
                          <strong>🌐</strong> {lecture.location}
                        </span>
                      )}
                      <span className="metadata-item">
                        <strong>📅</strong> {formatDate(lecture.date)}
                      </span>
                    </div>

                    {lecture.description && (
                      <p className="lecture-description-preview">
                        {lecture.description.length > 150
                          ? `${lecture.description.substring(0, 150)}...`
                          : lecture.description}
                      </p>
                    )}

                    <div className="lecture-badges">
                      {lecture.image && <span className="badge badge-green">Image</span>}
                      {lecture.pdf && <span className="badge badge-blue">PDF</span>}
                    </div>
                  </div>
                </div>

                <div className="lecture-admin-actions">
                  {lecture.image && (
                    <a
                      href={lecture.image}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-link"
                    >
                      View Image
                    </a>
                  )}
                  {lecture.pdf && (
                    <a
                      href={lecture.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-link"
                    >
                      View PDF
                    </a>
                  )}
                  <button
                    onClick={() => editLecture(lecture)}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLecture(lecture.id)}
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