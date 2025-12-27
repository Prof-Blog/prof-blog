import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/testimonials.css';

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    date: '',
    pdf: null
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pageId, setPageId] = useState(null);

  const load = async () => {
    const { data: page } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'testimonials')
      .single();

    if (page) {
      setPageId(page.id);

      const { data } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .eq('type', 'testimonial')
        .order('order_index');

      setItems(
        (data || []).map(d => ({ id: d.id, ...JSON.parse(d.value) }))
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setPdfFile(file);
    } else {
      alert('Please select a valid PDF file');
      e.target.value = '';
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) return form.pdf;

    const fileName = `testimonials/${Date.now()}_${pdfFile.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfFile);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const resetForm = () => {
    setForm({ title: '', category: '', date: '', pdf: null });
    setPdfFile(null);
    setEditingId(null);
    const fileInput = document.getElementById('pdf-input');
    if (fileInput) fileInput.value = '';
  };

  const addTestimonial = async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!pdfFile && !editingId) {
      alert('PDF file is required');
      return;
    }

    setUploading(true);

    try {
      const pdfUrl = await uploadPdf();

      const { data: maxOrder } = await supabase
        .from('content_blocks')
        .select('order_index')
        .eq('page_id', pageId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      await supabase.from('content_blocks').insert({
        page_id: pageId,
        type: 'testimonial',
        value: JSON.stringify({
          title: form.title,
          category: form.category || null,
          date: form.date || null,
          pdf: pdfUrl
        }),
        order_index: (maxOrder?.order_index || 0) + 1
      });

      resetForm();
      load();
    } catch (error) {
      alert('Error uploading testimonial: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateTestimonial = async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    setUploading(true);

    try {
      const pdfUrl = await uploadPdf();

      await supabase
        .from('content_blocks')
        .update({
          value: JSON.stringify({
            title: form.title,
            category: form.category || null,
            date: form.date || null,
            pdf: pdfUrl
          })
        })
        .eq('id', editingId);

      resetForm();
      load();
    } catch (error) {
      alert('Error updating testimonial: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async id => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    await supabase.from('content_blocks').delete().eq('id', id);
    load();
  };

  const startEdit = item => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category || '',
      date: item.date || '',
      pdf: item.pdf
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-testimonials">
      <div className="admin-testimonials-container">
        <header className="admin-header">
          <h1>Manage Testimonials</h1>
          <p>Add and organize appreciation letters and documents</p>
        </header>

        <section className="form-section">
          <div className="form-card">
            <h2>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Appreciation Letter from Department Head"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                placeholder="e.g., Student Feedback, Professional Recognition"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pdf-input">
                PDF Document * {editingId && '(Leave empty to keep current file)'}
              </label>
              <div className="file-input-wrapper">
                <input
                  id="pdf-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
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
                    onClick={updateTestimonial}
                    disabled={uploading}
                  >
                    {uploading ? 'Updating...' : 'Update Testimonial'}
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
                  onClick={addTestimonial}
                  disabled={uploading}
                >
                  {uploading ? 'Adding...' : 'Add Testimonial'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="list-section">
          <h2>Existing Testimonials ({items.length})</h2>
          
          {items.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>No testimonials yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="testimonials-admin-grid">
              {items.map(item => (
                <div key={item.id} className="admin-testimonial-card">
                  <div className="card-header">
                    <div className="pdf-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="card-info">
                      <h3>{item.title}</h3>
                      {item.category && <span className="category-badge">{item.category}</span>}
                      {item.date && (
                        <p className="date">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button
                      className="btn-icon btn-view"
                      onClick={() => window.open(item.pdf, '_blank')}
                      title="View PDF"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
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