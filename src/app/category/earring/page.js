import React from 'react';
import Gallery from '../../components/Gallery';

async function fetchProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/earrings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      categoryId: '76767FD2-9C64-40B5-BE48-BFAC32FB25C4',
      modifiedFrom: '2024-10-23 10:22:48'
    })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  return data;
}

export default async function Earring() {
  const products = await fetchProducts();
  const totalPages = 10;
  const page = 1;
  const baseURL = '/category/earring'

  return <Gallery
    items={products}
    totalPages={totalPages}
    page={page}
    itemLinkBaseURL={baseURL}
  />;
}

// export default async function Earring() {
//   const products = await fetchProducts();

//   return (
//     <div>
//       <h1>Products</h1>
//       {products && products.length > 0 ? (
//         <ul>
//           {products.map(product => (
//             <li key={product.id}>
//               <img src={product.image_path} alt={product.name} />
//               <p>{product.name}</p>
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>No products available.</p>
//       )}
//     </div>
//   );
// }