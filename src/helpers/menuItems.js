export const getMenuItems = (lang = 'uk') => {
  
  if (lang === 'ru') {
    return [
      {
        title: 'Кольца',
        link: `/${lang}/koltsa`
      },
      {
        title: 'Серьги',
        link: `/${lang}/sergi`
      },
      {
        title: 'Колье',
        link: `/${lang}/kolye`
      },
      {
        title: 'Браслеты',
        link: `/${lang}/braslety`
      }
    ];
  }

  return [
    {
      title: 'Каблучки',
      link: `/${lang}/kabluchki`
    },
    {
      title: 'Сережки',
      link: `/${lang}/serezhky`
    },
    {
      title: 'Кольє',
      link: `/${lang}/kolye`
    },
    {
      title: 'Браслети',
      link: `/${lang}/braslety`
    }
  ];
};
