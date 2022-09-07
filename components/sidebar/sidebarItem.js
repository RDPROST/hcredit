import Link from "next/link";
import Image from "next/image";
import {useRouter} from "next/router";
import loaderImg from "../../utils/loaderImg";


export default function SidebarItem({href, img, name}) {
    const router = useRouter();
    return(
        <Link href={href}>
            <a className={router.pathname === href ? "navbar__item navbar__item_active" : "navbar__item"}>
                <Image loader={loaderImg} src={img} alt={name} className="navbar__icon" width={25} height={25}/>
                <span className="navbar__text">{name}</span>
            </a>
        </Link>
    )
}