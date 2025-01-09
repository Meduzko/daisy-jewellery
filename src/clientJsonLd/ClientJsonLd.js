"use client";

import Script from "next/script";

export default function ClientJsonLd({ id, jsonData }) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonData),
      }}
    />
  );
}
