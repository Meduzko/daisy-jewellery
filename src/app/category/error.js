"use client";
import { useRouter } from "next/navigation";

export default function ErrorBoundary({ error }) {
    const router = useRouter();

    const handleClick = () => {
      router.push("/");
    };

    console.log(error);

    return (
        <div>
            <h1>Ooops, something went wrong</h1>
            <button onClick={handleClick}>Go to the Home page </button>
        </div>
    );
};