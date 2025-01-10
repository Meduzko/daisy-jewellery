import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const postsDirectory = path.join(process.cwd(), 'src', 'content');

export function getAllHtmlPosts() {
  if (!fs.existsSync(postsDirectory)) {
    console.error(`Error: Directory not found at ${postsDirectory}`);
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.html'))
    .map((fileName) => {
      const slug = fileName.replace('.html', '');
      const content = fs.readFileSync(path.join(postsDirectory, fileName), 'utf8');
      const { title, description, sections, date } = parseHtmlMetadata(content);

      return {
        slug,
        title,
        description,
        sections,
        date
      };
    });
}

// Get the content of a specific HTML file by slug
export function getHtmlPostBySlug(slug) {
  const filePath = path.join(postsDirectory, `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function parseHtmlMetadata(htmlContent) {
  const $ = cheerio.load(htmlContent);

  const title = $('title').text() || 'Untitled Post';
  const description =
    $('meta[name="description"]').attr('content') || $('p').first().text() || 'No description available.';
  // const image = $('img').first().attr('src') || null; // Extract the first image
  const sections = $('section')
    .slice(0, 2) // Get the first two <section> elements
    .map((_, section) => $(section).html())
    .get();
  const date = $('#date').text() || 'No date available';

  return { title, description, sections, date };
}

export function getHtmlPostMetadata(slug) {
  const content = getHtmlPostBySlug(slug);
  if (!content) return null;

  const $ = cheerio.load(content);
  const title = $('title').text() || `Blog Post - ${slug}`;
  const description = $('meta[name="description"]').attr('content') || 'No description available.';

  return { title, description };
}
