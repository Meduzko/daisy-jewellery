export const getMenuItems = (lang = 'uk') => {
  
  if (lang === 'ru') {
    return [
      {
        title: 'Кольца',
        link: `/${lang}/koltsa/1`
      },
      {
        title: 'Серьги',
        link: `/${lang}/sergi/1`
      },
      {
        title: 'Колье',
        link: `/${lang}/kolye/1`
      },
      {
        title: 'Браслеты',
        link: `/${lang}/braslety/1`
      }
    ];
  }

  return [
    {
      title: 'Каблучки',
      link: `/${lang}/kabluchki/1`
    },
    {
      title: 'Сережки',
      link: `/${lang}/serezhky/1`
    },
    {
      title: 'Кольє',
      link: `/${lang}/kolye/1`
    },
    {
      title: 'Браслети',
      link: `/${lang}/braslety/1`
    }
  ];
};
