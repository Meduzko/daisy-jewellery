This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Meta Pixel + Conversions API

Client-side and server-side tracking are integrated:
- PageView, ViewContent, AddToCart, InitiateCheckout are tracked via Meta Pixel.
- Purchase is sent server-side via the Conversions API after successful LiqPay callback.

Required environment variables:
```
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=xxxxxxxxxxxxxxxx
FACEBOOK_PIXEL_ID=xxxxxxxxxxxxxxxx            # optional, falls back to NEXT_PUBLIC_FACEBOOK_PIXEL_ID
FACEBOOK_ACCESS_TOKEN=EAAB...                 # system user token with ads_management permission
FB_TEST_EVENT_CODE=TESTxxxxxx                 # optional, for Events Manager Test Events
SITE_DOMAIN=https://daisy-jewellery.com.ua    # used as event_source_url
```

Notes:
- `_fbp` is set automatically by Pixel; `_fbc` is set from the `fbclid` URL param when present.
- Purchase event includes hashed user data (email/phone), contents, value, currency, and `event_id` (LiqPay `order_id`).

Testing:
1. Set `FB_TEST_EVENT_CODE` and deploy/run.
2. Open the site with a clean session and navigate to a product page — you should see PageView and ViewContent in Test Events.
3. Add to cart — you should see AddToCart.
4. Begin checkout — you should see InitiateCheckout.
5. Complete a test payment — server should log the Purchase event in Test Events.
