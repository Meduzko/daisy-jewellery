import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const postsDirectory = (lang = 'uk') => path.join(process.cwd(), 'src', 'content', lang);

export function getAllHtmlPosts({ lang }) {
  if (!fs.existsSync(postsDirectory(lang))) {
    console.error(`Error: Directory not found at ${postsDirectory(lang)}`);
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory(lang));
  return fileNames
    .filter((fileName) => fileName.endsWith('.html'))
    .map((fileName) => {
      const slug = fileName.replace('.html', '');
      const content = fs.readFileSync(path.join(postsDirectory(lang), fileName), 'utf8');
      const { title, description, sections, date } = parseHtmlMetadata(content);

      return {
        slug,
        title,
        description,
        sections,
        date
      };
    })
    .sort((a, b) => {
      const parseDate = (str) => {
        // Очікується формат DD.MM.YYYY
        const [day, month, year] = str.split('.');
        return new Date(`${year}-${month}-${day}`);
      };

      return parseDate(b.date) - parseDate(a.date); // Від новішого до старішого
    });
}

// Get the content of a specific HTML file by slug
export function getHtmlPostBySlug(slug, lang) {
  const filePath = path.join(postsDirectory(lang), `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function parseHtmlMetadata(htmlContent) {
  const $ = cheerio.load(htmlContent);

  const title = $('#title').text() || 'Untitled Post';
  const description = $('#description').text() || 'Untitled Post';
  // const description =
  //   $('meta[name="description"]').attr('content') || $('p').first().text() || 'No description available.';
  // const image = $('img').first().attr('src') || null; // Extract the first image
  const sections = $('section')
    .slice(0, 2) // Get the first two <section> elements
    .map((_, section) => $(section).html())
    .get();
  const date = $('#date').text() || 'No date available';

  return { title, description, sections, date };
}

export function getHtmlPostMetadata(slug, lang = 'uk') {
  const content = getHtmlPostBySlug(slug, lang);
  if (!content) return null;

  const $ = cheerio.load(content);
  const title = $('#title').text() || `Blog Post - ${slug}`;
  const description = $('#description').text() || 'Untitled Post';

  return { title, description };
}

export async function getBlogContent(locale, slug) {
  const filePath = path.join(process.cwd(), 'src', 'content', locale, `${slug}.html`);
  try {
    return fs.readFileSync(filePath, 'utf-8'); // Read the HTML file content
  } catch (error) {
    return null; // Return null if the file is not found
  }
}
