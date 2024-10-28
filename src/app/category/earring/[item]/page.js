import Link from "next/link"
// import ProductItemPage from '../../../components/ProductPage';
import ProductPageNew from '../../../components/ProductPage/ProductPageNew';
// import { usePathname } from "next/navigation";

async function fetchProducts({ code }) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/earrings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId: '76767FD2-9C64-40B5-BE48-BFAC32FB25C4',
        modifiedFrom: '2024-10-23 10:22:48',
        code
      })
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
  
    const data = await res.json();
    return data;
}

export default async function EarringItem({ params }) {
    console.log(params.item);
    const [product] = await fetchProducts({ code: params.item });
    console.log(product);

    return (
        // <div>
        //     <h1>{`Ring Item #${params.item}`}</h1>
        //     <Link href={`/category/${params.item += 1}`}>Go to ring item #2</Link>
        // </div>
        <ProductPageNew item={product} />
    )
}
