import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/page.css';

export default function AdminPage() {
  const { slug } = useParams();
  const [pageId, setPageId] = useState(null);
  const [content, setContent] = useState([]);

  /* ================= FETCH PAGE ID ================= */
  useEffect(() => {
    supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        if (data) setPageId(data.id);
      });
  }, [slug]);

  /* ================= FETCH CONTENT BLOCKS ================= */
  useEffect(() => {
    if (!pageId) return;

    supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', pageId)
      .in('type', ['text', 'image'])
      .order('order_index')
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        setContent(data || []);
      });
  }, [pageId]);

  /* ================= UPDATE TEXT ================= */
  const updateText = (id, value) => {
    setContent(prev =>
      prev.map(block =>
        block.id === id ? { ...block, value } : block
      )
    );
  };

  /* ================= SAVE TEXT ================= */
  const saveTextBlock = async block => {
    const { error } = await supabase
      .from('content_blocks')
      .update({ value: block.value })
      .eq('id', block.id);

    if (error) {
      alert(error.message);
    } else {
      alert('Text saved');
    }
  };

  /* ================= UPLOAD IMAGE ================= */
  const uploadImage = async (file, blockId) => {
    if (!file) {
      alert('No file selected');
      return;
    }

    const ext = file.name.split('.').pop();
    const fileName = `${blockId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      alert('Failed to get image URL');
      return;
    }

    const { error: dbError } = await supabase
      .from('content_blocks')
      .update({
        value: `${urlData.publicUrl}?t=${Date.now()}`
      })
      .eq('id', blockId);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    const { data: refreshed } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', pageId)
      .in('type', ['text', 'image'])
      .order('order_index');

    setContent(refreshed || []);
  };

  /* ================= RICH TEXT EDITOR COMPONENT ================= */
  const RichTextEditor = ({ block, onUpdate }) => {
    const editorRef = useRef(null);
    const isInitialized = useRef(false);

    // Initialize content only once
    useEffect(() => {
      if (editorRef.current && !isInitialized.current) {
        editorRef.current.innerHTML = block.value || '';
        isInitialized.current = true;
      }
    }, [block.value]);

    const execCommand = (cmd, value = null) => {
      document.execCommand(cmd, false, value);
      editorRef.current?.focus();
    };

    const handleInput = () => {
      if (editorRef.current) {
        onUpdate(block.id, editorRef.current.innerHTML);
      }
    };

    return (
      <div className="rich-text-container">
        <div className="toolbar">
          <button onClick={() => execCommand('bold')} title="Bold" type="button">
            <strong>B</strong>
          </button>
          <button onClick={() => execCommand('italic')} title="Italic" type="button">
            <em>I</em>
          </button>
          <button onClick={() => execCommand('underline')} title="Underline" type="button">
            <u>U</u>
          </button>
          <span className="divider">|</span>
          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Size</option>
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
          <span className="divider">|</span>
          <button onClick={() => execCommand('justifyLeft')} title="Align Left" type="button">
            ≡
          </button>
          <button onClick={() => execCommand('justifyCenter')} title="Center" type="button">
            ≡
          </button>
          <button onClick={() => execCommand('justifyRight')} title="Align Right" type="button">
            ≡
          </button>
          <span className="divider">|</span>
          <button onClick={() => execCommand('insertUnorderedList')} title="Bullet List" type="button">
            • List
          </button>
          <button onClick={() => execCommand('insertOrderedList')} title="Numbered List" type="button">
            1. List
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="rich-editor"
          onInput={handleInput}
          suppressContentEditableWarning
        />
      </div>
    );
  };

  /* ================= RENDER ================= */
  return (
    <div className="page-container">
      <h2>Editing: {slug}</h2>

      {content.map(block => {
        if (block.type === 'text') {
          return (
            <div key={block.id} className="admin-block">
              <RichTextEditor block={block} onUpdate={updateText} />
              <button onClick={() => saveTextBlock(block)}>
                Save Text
              </button>
            </div>
          );
        }

        if (block.type === 'image') {
          return (
            <div key={block.id} className="admin-block">
              {block.value && (
                <img
                  src={block.value}
                  alt="Preview"
                  className="profile-image"
                />
              )}

              <div className="file-group">
                <label className="file-label">
                  Replace Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e =>
                    uploadImage(e.target.files[0], block.id)
                  }
                />
                <small className="file-hint">
                  JPG, PNG, WEBP
                </small>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}