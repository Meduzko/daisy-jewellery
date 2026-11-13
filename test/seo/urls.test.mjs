import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildAlternates, localizeSegment, getCanonicalRedirect } from '../../src/helpers/seo.js';

const redirect = (path) => getCanonicalRedirect(new URL(`https://daisy-jewellery.com.ua${path}`))?.href.replace('https://daisy-jewellery.com.ua', '') ?? null;

describe('canonical URL redirects (middleware)', () => {
  test('canonical URLs pass through', () => {
    for (const path of ['/uk', '/ru', '/uk/kabluchki', '/ru/koltsa', '/ru/kolye/kupit-serebryanoye-kolye/4830', '/uk/blog/yak-vyznachyty-rozmir-kabluchky', '/uk/kabluchki?sort=price']) {
      assert.equal(redirect(path), null, path);
    }
  });

  test('non-localized and malformed locale paths go to /uk in one hop', () => {
    assert.equal(redirect('/'), '/uk');
    assert.equal(redirect('/about'), '/uk/about');
    assert.equal(redirect('/ukxyz'), '/uk/ukxyz');
    assert.equal(redirect('/UK/kabluchki'), '/uk/kabluchki');
    assert.equal(redirect('/koltsa?utm_source=x'), '/uk/kabluchki');
  });

  test("the other locale's slugs are translated", () => {
    assert.equal(redirect('/ru/kabluchki'), '/ru/koltsa');
    assert.equal(redirect('/uk/sergi'), '/uk/serezhky');
    assert.equal(redirect('/ru/kabluchki/kupyty-sribnu-kabluchku/828'), '/ru/koltsa/kupit-serebryanoye-koltso/828');
    assert.equal(redirect('/uk/kolye/kupit-serebryanoye-kolye/4830'), '/uk/kolye/kupyty-sribne-kolye/4830');
    assert.equal(redirect('/ru/blog/yak-vyznachyty-rozmir-kabluchky'), '/ru/blog/kak-uznat-razmer-kolca');
  });

  test('tracking params are stripped, other params kept', () => {
    assert.equal(redirect('/uk/kabluchki?utm_source=ig&q=клевер'), `/uk/kabluchki?q=${encodeURIComponent('клевер')}`);
  });
});

describe('alternates', () => {
  test('both locales: self canonical + hreflang + x-default', () => {
    const a = buildAlternates('ru', { uk: 'uk/kabluchki', ru: 'ru/koltsa' });
    assert.match(a.canonical, /\/ru\/koltsa$/);
    assert.match(a.languages['uk-UA'], /\/uk\/kabluchki$/);
    assert.match(a.languages['ru-UA'], /\/ru\/koltsa$/);
    assert.equal(a.languages['x-default'], a.languages['uk-UA']);
  });

  test('no ru version: ru canonicalizes to uk and is not an alternate', () => {
    const a = buildAlternates('ru', { uk: 'uk/oferta', ru: null });
    assert.match(a.canonical, /\/uk\/oferta$/);
    assert.equal(a.languages['ru-UA'], undefined);
  });

  test('homepage has no trailing slash', () => {
    assert.match(buildAlternates('uk', { uk: 'uk', ru: 'ru' }).canonical, /\.ua\/uk$/);
  });

  test('localizeSegment keeps unknown segments', () => {
    assert.equal(localizeSegment('828', 'ru'), '828');
    assert.equal(localizeSegment('koltsa', 'uk'), 'kabluchki');
  });
});
