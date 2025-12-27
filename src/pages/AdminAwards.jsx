import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/awards.css';

export default function AdminAwards() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    year: '',
    body: '',
    context: '',
    pdf: null,
    image: null
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pageId, setPageId] = useState(null);

  const load = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'awards')
      .single();

    if (page) {
      setPageId(page.id);

      const { data } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .eq('type', 'award')
        .order('order_index');

      setItems(
        (data || []).map(d => ({ id: d.id, ...JSON.parse(d.value) }))
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePdfChange = e => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) {
        alert('PDF file size must be less than 10MB');
        return;
      }
      setPdfFile(file);
    } else {
      alert('Please select a valid PDF file');
      e.target.value = '';
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB');
        return;
      }
      setImageFile(file);
    } else {
      alert('Please select a valid image file');
      e.target.value = '';
    }
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;

    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const resetForm = () => {
    setForm({
      title: '',
      year: '',
      body: '',
      context: '',
      pdf: null,
      image: null
    });
    setPdfFile(null);
    setImageFile(null);
    setEditingId(null);
    
    const pdfInput = document.getElementById('pdf-input');
    const imageInput = document.getElementById('image-input');
    if (pdfInput) pdfInput.value = '';
    if (imageInput) imageInput.value = '';
  };

  const addAward = async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    setUploading(true);

    try {
      const pdfUrl = pdfFile ? await uploadFile(pdfFile, 'awards') : null;
      const imageUrl = imageFile ? await uploadFile(imageFile, 'awards-images') : null;

      const { data: maxOrder } = await supabase
        .from('content_blocks')
        .select('order_index')
        .eq('page_id', pageId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'award',
        value: JSON.stringify({
          title: form.title,
          year: form.year || null,
          body: form.body || null,
          context: form.context || null,
          pdf: pdfUrl,
          image: imageUrl
        }),
        order_index: (maxOrder?.order_index || 0) + 1
      });

      resetForm();
      load();
    } catch (error) {
      alert('Error adding award: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateAward = async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    setUploading(true);

    try {
      const pdfUrl = pdfFile ? await uploadFile(pdfFile, 'awards') : form.pdf;
      const imageUrl = imageFile ? await uploadFile(imageFile, 'awards-images') : form.image;

      await supabase
        .from('content_blocks')
        .update({
          value: JSON.stringify({
            title: form.title,
            year: form.year || null,
            body: form.body || null,
            context: form.context || null,
            pdf: pdfUrl,
            image: imageUrl
          })
        })
        .eq('id', editingId);

      resetForm();
      load();
    } catch (error) {
      alert('Error updating award: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async id => {
    if (!confirm('Are you sure you want to delete this award?')) return;

    await supabase.from('content_blocks').delete().eq('id', id);
    load();
  };

  const startEdit = item => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      year: item.year || '',
      body: item.body || '',
      context: item.context || '',
      pdf: item.pdf || null,
      image: item.image || null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-awards">
      <div className="admin-awards-container">
        <header className="admin-header">
          <h1>Manage Awards</h1>
          <p>Add and organize awards, honors, and recognition</p>
        </header>

        <section className="form-section">
          <div className="form-card">
            <h2>{editingId ? 'Edit Award' : 'Add New Award'}</h2>
            
            <div className="form-group">
              <label htmlFor="title">Award Title *</label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Best Teacher Award"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  id="year"
                  type="text"
                  placeholder="e.g., 2024"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="body">Awarding Body</label>
                <input
                  id="body"
                  type="text"
                  placeholder="e.g., University of Example"
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="context">Description</label>
              <textarea
                id="context"
                rows="4"
                placeholder="Brief description of the award and its significance..."
                value={form.context}
                onChange={e => setForm({ ...form, context: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image-input">
                Award Image {editingId && '(Leave empty to keep current image)'}
              </label>
              <div className="file-input-wrapper">
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imageFile && (
                  <span className="file-name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {imageFile.name}
                  </span>
                )}
              </div>
              <small>Maximum file size: 5MB, Image formats: JPG, PNG, WebP</small>
            </div>

            <div className="form-group">
              <label htmlFor="pdf-input">
                Certificate PDF {editingId && '(Leave empty to keep current file)'}
              </label>
              <div className="file-input-wrapper">
                <input
                  id="pdf-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                />
                {pdfFile && (
                  <span className="file-name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {pdfFile.name}
                  </span>
                )}
              </div>
              <small>Maximum file size: 10MB, PDF format only</small>
            </div>

            <div className="form-actions">
              {editingId ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={updateAward}
                    disabled={uploading}
                  >
                    {uploading ? 'Updating...' : 'Update Award'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={addAward}
                  disabled={uploading}
                >
                  {uploading ? 'Adding...' : 'Add Award'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="list-section">
          <h2>Existing Awards ({items.length})</h2>
          
          {items.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
              <p>No awards yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="awards-admin-grid">
              {items.map(item => (
                <div key={item.id} className="admin-award-card">
                  <div className="card-visual">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="placeholder-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="7" />
                          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-details">
                    <div className="card-meta">
                      {item.year && <span className="year-badge">{item.year}</span>}
                      {item.body && <span className="body-badge">{item.body}</span>}
                    </div>
                    <h3>{item.title}</h3>
                    {item.context && (
                      <p className="context-preview">
                        {item.context.length > 100 
                          ? item.context.substring(0, 100) + '...' 
                          : item.context}
                      </p>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    {item.pdf && (
                      <button
                        className="btn-icon btn-view"
                        onClick={() => window.open(item.pdf, '_blank')}
                        title="View Certificate"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        PDF
                      </button>
                    )}
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => startEdit(item)}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => deleteItem(item.id)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}