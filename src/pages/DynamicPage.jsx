import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/page.css';

export default function DynamicPage({ isHome = false }) {
  const params = useParams();
  const slug = isHome ? 'home' : params.slug;

  const [content, setContent] = useState([]);
  const [pageId, setPageId] = useState(null);

  useEffect(() => {
    supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .single()
      .then(({ data }) => data && setPageId(data.id));
  }, [slug]);

  useEffect(() => {
    if (!pageId) return;

    supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', pageId)
      .in('type', ['text', 'image', 'video', 'pdf'])
      .order('order_index')
      .then(({ data }) => setContent(data || []));
  }, [pageId]);

  return (
    <div className="page-container">
      {content.map(block => {
        if (block.type === 'image')
          return <img key={block.id} src={block.value} className="profile-image" />;

        if (block.type === 'text')
  return (
    <div 
      key={block.id} 
      className="text-block"
      dangerouslySetInnerHTML={{ __html: block.value }}
    />
  );

        if (block.type === 'video')
          return <video key={block.id} src={block.value} controls className="media" />;

        if (block.type === 'pdf')
          return (
            <a key={block.id} href={block.value} target="_blank" rel="noreferrer">
              View document
            </a>
          );

        return null;
      })}
    </div>
  );
}
