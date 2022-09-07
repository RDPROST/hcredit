import Link from "next/link";
import loaderImg from "../../utils/loaderImg";
import Image from "next/image";

export default function Logo(props) {
    return (
        <Link href="/">
            <Image loader={loaderImg} src={`/assets/images/Logo.svg`} alt="" className="logo" width={295} height={37} {...props}/>
        </Link>
    );
}