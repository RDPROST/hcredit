import Image from "next/image";
import loaderImg from "../../utils/loaderImg";

export default function ContentTimer({time}) {
    const hours = Math.floor(time / 60);
    const minutes = (time % 60 < 10) ? "0" + (time % 60) : time % 60;

    return (
        <div className="description__timer">
            <Image loader={loaderImg} src={`/assets/images/icons/timer.svg`} alt="" width={45} height={45}/>
            <p className="description__timer-text" style={{fontSize:hours>0 ? 12 : 16}}>{time}</p>
        </div>
    )
}