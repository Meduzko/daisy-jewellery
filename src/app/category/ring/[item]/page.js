import Link from "next/link"
// import ProductItemPage from '../../../components/ProductPage';
import ProductPageNew from '../../../components/ProductPage/ProductPageNew';
// import { usePathname } from "next/navigation";

export default function RingItem({ params }) {
    console.log(params.item);
    return (
        // <div>
        //     <h1>{`Ring Item #${params.item}`}</h1>
        //     <Link href={`/category/${params.item += 1}`}>Go to ring item #2</Link>
        // </div>
        <ProductPageNew item={params.item} />
    )
}
