import {useSelector} from "react-redux";
import Loader from "../global/loader";
import Image from "next/image";
import loaderImgUrl from "../../utils/loaderImgUrl";
export default function User() {
    const user = useSelector(state => state.user);
    return user.signedIn ? (
        <div className="header__user">
            {user.avatar === "/pics/nophoto.jpg" ? (
                <div className="header__user-noavatar" style={{"background" : user.gender === "M" ? "#315B7C" : "#FF5561"}}>
                    {user.firstname[0]}{user.lastname[0]}
                </div>
                )
                : (
                <Image
                    loader={loaderImgUrl}
                    src={user.avatar}
                    alt="" className="header__user-avatar" width={50} height={50}/>
            )}


            <div className="header__user-group">
                <h4 className="header__user-name">{user.firstname} {user.lastname}</h4>
                <p className="header__user-position">{user.org}</p>
            </div>
        </div>
    ) : (
        <Loader height={50} />
    )
}