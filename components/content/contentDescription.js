import Image from "next/image";
import ContentTimer from "./contentTimer";
import {useSelector} from "react-redux";
import DefaultButton from "../button/defaultButton";
import Link from "next/link";

export default function ContentDescription({setAction, setIsBuild, id, title, description, image,links, training_files, trainer_files, time, archive}) {
        const {role} = useSelector(state => state.user);
        const editButton = () => {
            setAction("edit");
            setIsBuild(true)
        }
        return (
        <>
            <h3 className="description__title">{title}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={image}
                alt="" className="description__img" />
            <p className="description__text" dangerouslySetInnerHTML={{__html: description}}></p>
            <h3 className="description__title">Длительность активности, мин</h3>
            <ContentTimer time={time} />
            {training_files?.length > 0 ?
                (
                    <>
                        <h3 className="description__title">Дотренинговые материалы</h3>
                        <div className="description__files">
                            {
                                training_files.map(file => {
                                    return (<a href={file.url} target="_blank" rel="noreferrer" key={file.id} className="description__file">
                                        <Image src={`/assets/images/icons/file-${file.type}.svg`} alt="" width={45} height={45}/>
                                    </a>)
                                })
                            }
                        </div>
                    </>
                )
                : null}
            {links?.length > 0 ?
                (
                    <>
                        <div className="description__links">
                            {
                                links.map((link, index) => {
                                    return (<a href={link.url} key={index} className="description__link" target="_blank" rel="noreferrer">
                                        {link.name}
                                    </a>)
                                })
                            }
                        </div>
                    </>
                )
                : null}
            {trainer_files?.length > 0 && role !== "student" ?
                (
                    <>
                        <h3 className="description__title">Материалы для тренера</h3>
                        <div className="description__files">
                            {
                                trainer_files.map(file => {
                                    return (<a href={file.url} key={file.id} className="description__file" target="_blank" rel="noreferrer">
                                        <Image src={`/assets/images/icons/file-${file.type}.svg`} alt="" width={45} height={45}/>
                                    </a>)
                                })
                            }
                        </div>
                    </>
                )
                : null}
            {(role !== "student" && (role === "trainer" || role === "admin" || role === "methodist")) ?
                (
                    <>
                        {(role !== "trainer" && !archive) ? <Link href={`/management/${id}`}>
                            <DefaultButton className={"description__button"} text={"Создать мероприятие"} />
                        </Link> : null}
                        <DefaultButton className={"description__button description__button-gray"} text={"Редактировать"} onClick={editButton} />
                    </>
                ) : null}
        </>
    )
}