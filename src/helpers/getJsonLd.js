export const getCategoryJsonLd = ({ categoryName, categoryDescription, url, lowPrice, highPrice }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": categoryName,
    "image": "https://daisy-jewellery.com.ua/_next/image?url=https%3A%2F%2Fcdn.dntrade.com.ua%2FD696FCD1-FB06-470D-9088-C5F062485E1E%2F2054%25D1%2580_2.jpg&w=640&q=75",
    "brand": "Daisy Jewellery",
    "description": categoryDescription,
    "material": ["Срібло"],
    "offers": {
      "@type": "AggregateOffer",
      "url": `https://daisy-jewellery.com.ua/${url}`,
      "lowPrice": lowPrice,
      "highPrice": highPrice,
      "priceCurrency": "UAH",
      "availability": "http://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  }

  return jsonLd;
}

export const getProductJsonLd = (product, categoryUrl) => {
  const {
    title,
    short_description: description,
    images,
    price,
    code
  } = product;

  const plainTextDescription = description.replace(/<[^>]*>/g, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: images[0],
    brand: "Daisy Jewellery",
    description: plainTextDescription,
    sku: `${code}`,
    "material": ["Срібло"],
    "offers": {
      "@type": "Offer",
      url: `https://daisy-jewellery.com.ua/${categoryUrl}/${code}`,
      price: `${price}`,
      priceCurrency: "UAH",
      availability: "http://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return jsonLd;
};


export const getLogoJsonLd = () => {
  const jsonLd = {
    "@context": "http://schema.org",
    "@type": "Organization",
    "name": "Daisy Jewellery",
    "@id": "https://daisy-jewellery.com.ua/#organization",
    "url": "https://daisy-jewellery.com.ua/",
    "logo": {
      "@type": "ImageObject",
      "@id": "https://daisy-jewellery.com.ua/_next/image?url=%2Flogo_black.png&w=128&q=75",
      "inLanguage": " uk-UA",
      "url": "https://daisy-jewellery.com.ua/_next/image?url=%2Flogo_black.png&w=128&q=75",
      "contentUrl": "https://daisy-jewellery.com.ua/_next/image?url=%2Flogo_black.png&w=128&q=75",
      "width": 263,
      "height": 41,
      "caption": "Daisy Jewellery"
    }
  }

  return jsonLd;
};

export const getBussinesJsonLd = () => {
  return {
    "@context": "http://schema.org",
    "@type": "LocalBusiness",
    "url": "https://daisy-jewellery.com.ua/", 
    "priceRange": "UAH",
    "name": "Daisy Jewellery",
    "logo": "https://daisy-jewellery.com.ua/_next/image?url=%2Flogo_black.png&w=128&q=75",
    "image": [
      "https://daisy-jewellery.com.ua/_next/image?url=https%3A%2F%2Fcdn.dntrade.com.ua%2FD696FCD1-FB06-470D-9088-C5F062485E1E%2F424_2.jpg&w=640&q=75",
      "https://daisy-jewellery.com.ua/_next/image?url=https%3A%2F%2Fcdn.dntrade.com.ua%2FD696FCD1-FB06-470D-9088-C5F062485E1E%2F436%25D1%2580_1.jpg&w=640&q=75",
      "https://daisy-jewellery.com.ua/_next/image?url=https%3A%2F%2Fcdn.dntrade.com.ua%2FD696FCD1-FB06-470D-9088-C5F062485E1E%2F2054%25D1%2580_2.jpg&w=640&q=75"
    ],
    "currenciesAccepted": "UAH",
    "paymentAccepted": "cash, credit card",
    "hasMap": "https://maps.app.goo.gl/6TpG5JPm5LQsNSQYA",
    "address": {
      "@type": "PostalAddress",
      "@id": "https://daisy-jewellery.com.ua/",
      "name": "Daisy Jewellery",
      "addressLocality": "Корець",
      "postalCode": "34700",
      "streetAddress": "вулиця Київська 3/3",
      "telephone": "+380935492986",
      "email": "daisyjewellery.info@gmail.com",
      "addressCountry": "Ukraine"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+380935492986",
        "contactType": "customer support"
      }
    ]
  }
};

export const getWebSiteJsonLd = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://daisy-jewellery.com.ua/#website",
    "url": "https://daisy-jewellery.com.ua/",
    "name": "Срібні прикраси Daisy Jewellery",
    "description": "Daisy Jewellery – вишукані срібні прикраси для будь-якої нагоди. Замовляйте онлайн з доставкою по Україні.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://daisy-jewellery.com.ua/search?query={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
};
