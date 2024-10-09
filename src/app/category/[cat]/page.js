import Link from "next/link"
// import { usePathname } from "next/navigation";

export default function Cat({ params }) {
    console.log(params.cat);
    return (
        <div>
            <h1>{`Cat #${params.cat}`}</h1>
            <Link href={`/category/${params.cat += 1}`}>Go to cat #2</Link>
        </div>
    )
}