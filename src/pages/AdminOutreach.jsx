import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/page.css';
import '../styles/outreach.css';

export default function AdminOutreach() {
  const [pageId, setPageId] = useState(null);
  const [outreachList, setOutreachList] = useState([]);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'outreach')
      .single();
    
    if (!page) return;
    setPageId(page.id);

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

    setOutreachList(parsed);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setDescription('');
    setDate('');
    setImage(null);
    setPdf(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setExistingPdfUrl(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Outreach title is required');
      return;
    }
    if (!description.trim()) {
      alert('Description is required');
      return;
    }

    let imageUrl = existingImageUrl;
    let pdfUrl = existingPdfUrl;

    // Upload new image if provided
    if (image) {
      const imgName = `outreach-${Date.now()}-${image.name}`;
      const { error: imgError } = await supabase.storage
        .from('images')
        .upload(imgName, image, { upsert: true });

      if (!imgError) {
        imageUrl = supabase.storage
          .from('images')
          .getPublicUrl(imgName).data.publicUrl;
      }
    }

    // Upload new PDF if provided
    if (pdf) {
      const pdfName = `outreach-pdf-${Date.now()}-${pdf.name}`;
      const { error: pdfError } = await supabase.storage
        .from('pdfs')
        .upload(pdfName, pdf, { upsert: true });

      if (!pdfError) {
        pdfUrl = supabase.storage
          .from('pdfs')
          .getPublicUrl(pdfName).data.publicUrl;
      }
    }

    const value = {
      title: title.trim(),
      category: category.trim() || 'Others',
      description: description.trim(),
      date: date || null,
      image: imageUrl,
      pdf: pdfUrl
    };

    if (editingId) {
      // Update existing
      await supabase
        .from('content_blocks')
        .update({ value: JSON.stringify(value) })
        .eq('id', editingId);
    } else {
      // Create new
      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'outreach',
        value: JSON.stringify(value),
        order_index: Date.now()
      });
    }

    resetForm();
    loadData();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category || '');
    setDescription(item.description || '');
    setDate(item.date || '');
    setExistingImageUrl(item.image);
    setExistingPdfUrl(item.pdf);
    setImagePreview(item.image);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this outreach activity?')) {
      return;
    }

    await supabase
      .from('content_blocks')
      .delete()
      .eq('id', id);
    
    setOutreachList(outreachList.filter(item => item.id !== id));
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
    <div className="admin-outreach-container">
      <div className="admin-outreach-header">
        <h1>Outreach Management</h1>
        <p className="admin-subtitle">Manage community programs, workshops, and educational initiatives</p>
      </div>

      {/* Add/Edit Form */}
      <section className="admin-section">
        <div className="section-header">
          <h2>{editingId ? 'Edit Outreach Activity' : 'Add Outreach Activity'}</h2>
        </div>
        <div className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="outreach-title">Activity Title *</label>
              <input
                id="outreach-title"
                type="text"
                placeholder="e.g., AI Workshop for High School Students"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="outreach-category">Category</label>
              <input
                id="outreach-category"
                type="text"
                placeholder="e.g., Workshops, Community Events, Seminars"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="outreach-description">Description *</label>
            <textarea
              id="outreach-description"
              placeholder="Provide a detailed description of the outreach activity, its objectives, and outcomes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="outreach-date">Date</label>
            <input
              id="outreach-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="outreach-image">Activity Photo</label>
              <input
                id="outreach-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-file"
              />
              <small className="form-hint">Optional: Upload a photo from the activity</small>
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="outreach-pdf">Supporting Document (PDF)</label>
              <input
                id="outreach-pdf"
                type="file"
                accept="application/pdf"
                onChange={e => setPdf(e.target.files[0])}
                className="form-file"
              />
              <small className="form-hint">Optional: Brochure, program details, or report</small>
              {pdf && <p className="file-name-display">📄 {pdf.name}</p>}
              {!pdf && existingPdfUrl && <p className="file-name-display">📄 PDF attached</p>}
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingId ? 'Update Activity' : 'Add Activity'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Existing Outreach List */}
      <section className="admin-section">
        <div className="section-header">
          <h2>Existing Outreach Activities</h2>
          <span className="entry-count">{outreachList.length} activities</span>
        </div>

        {outreachList.length === 0 ? (
          <div className="empty-state">
            <p>No outreach activities yet. Add your first activity above.</p>
          </div>
        ) : (
          <div className="outreach-admin-grid">
            {outreachList.map(item => (
              <div key={item.id} className="outreach-admin-card">
                {item.image && (
                  <div className="outreach-admin-image">
                    <img src={item.image} alt={item.title} />
                  </div>
                )}
                
                <div className="outreach-admin-content">
                  <div className="outreach-admin-header">
                    <h3>{item.title}</h3>
                    <span className="category-tag">{item.category || 'Others'}</span>
                  </div>
                  
                  {item.date && (
                    <span className="date-badge">
                      📅 {formatDate(item.date)}
                    </span>
                  )}
                  
                  <p className="outreach-description-preview">
                    {item.description.length > 150
                      ? `${item.description.substring(0, 150)}...`
                      : item.description}
                  </p>
                  
                  <div className="media-badges">
                    {item.image && <span className="badge badge-green">📷 Image</span>}
                    {item.pdf && <span className="badge badge-blue">📄 PDF</span>}
                  </div>
                  
                  <div className="outreach-admin-actions">
                    {item.image && (
                      <a
                        href={item.image}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-link"
                      >
                        View Image
                      </a>
                    )}
                    {item.pdf && (
                      <a
                        href={item.pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-link"
                      >
                        View PDF
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}