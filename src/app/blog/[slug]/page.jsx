import { getHtmlPostBySlug } from '../../../lib/posts';
import { notFound } from 'next/navigation';

export default function BlogPostPage({ params }) {
  const content = getHtmlPostBySlug(params.slug);

  if (!content) {
    notFound();
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
