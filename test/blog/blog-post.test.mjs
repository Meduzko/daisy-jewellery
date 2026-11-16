import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, toBlogPost } from '../../src/lib/blogPost.js';

test('sanitizeHtml keeps article markup and strips script vectors', () => {
  const html = sanitizeHtml(
    '<h2>Розмір</h2><p onclick="x()">Текст <a href="JavaScript:alert(1)">a</a> <a href="/uk/kabluchki">ok</a></p>'
    + '<script>alert(1)</script><img src="https://cms.example/assets/1" onerror="x()"><iframe src="//evil"></iframe>'
  );
  assert.equal(html, '<h2>Розмір</h2><p>Текст <a>a</a> <a href="/uk/kabluchki">ok</a></p><img src="https://cms.example/assets/1">');
});

test('toBlogPost maps a row to the static-post shape with Kyiv date and hreflang paths', () => {
  const post = toBlogPost({
    locale: 'ru', slug: 'kak-vybrat', title: 'Как выбрать', excerpt: 'Анонс', content: '<p>x</p>', seo_title: null,
    seo_description: null, cover_image: 'abc', published_at: '2026-11-12T23:30:00Z', updated_at: '2026-11-13T08:00:00Z',
  }, { uk: 'yak-obraty', ru: 'kak-vybrat' }, 'https://cms.example/assets/');
  assert.equal(post.date, '13.11.2026'); // 01:30 in Kyiv
  assert.equal(post.datePublished, '2026-11-13');
  assert.equal(post.seoTitle, 'Как выбрать');
  assert.equal(post.description, 'Анонс');
  assert.equal(post.image, 'https://cms.example/assets/abc');
  assert.deepEqual(post.paths, { uk: 'uk/blog/yak-obraty', ru: 'ru/blog/kak-vybrat' });
});
