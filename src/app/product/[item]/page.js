import Link from "next/link"
// import { usePathname } from "next/navigation";

export default function Item({ params }) {
    console.log(params.item);
    return (
        <div>
            <h1>{`Item #${params.item}`}</h1>
            <Link href={`/category/${params.item += 1}`}>Go to item #2</Link>
        </div>
    )
}
