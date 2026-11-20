import Hero from '../Hero/Hero';
import PromoSlide from './PromoSlide';
import HeroCarousel from './HeroCarousel';
import { HERO_INTERVAL_MS, HERO_SLIDES } from './slides';
import { getHomeCopy } from '../copy';

// Homepage hero slider: slides are configured in ./slides.js, their copy in ../copy.js (heroSlider).
// Slides render on the server; HeroCarousel (client) only switches between them.
export default function HeroSlider({ lang = 'uk' }) {
  const copy = getHomeCopy(lang);
  const { slides: slideCopy, ...labels } = copy.heroSlider;
  const names = [];

  const nodes = HERO_SLIDES.map((slide, i) => {
    const preload = i === 0; // only the first slide is the LCP candidate
    if (slide.type === 'campaign') {
      names.push(copy.hero.label);
      return <Hero key={slide.id} lang={lang} preload={preload} />;
    }
    const c = slideCopy[slide.id];
    names.push(c.name);
    return <PromoSlide key={slide.id} slide={slide} copy={c} lang={lang} preload={preload} />;
  });

  return (
    <HeroCarousel names={names} labels={labels} interval={HERO_INTERVAL_MS}>
      {nodes}
    </HeroCarousel>
  );
}
