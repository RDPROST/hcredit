import {QRCodeSVG} from 'qrcode.react';
import FlexTwo from "../../components/global/flexTwo";
import FlexOne from "../../components/global/flexOne";
import {useSelector} from "react-redux";
import {useEffect, useState} from "react";
import ContentTimer from "../../components/content/contentTimer";
import ContentImageBg from "../../components/content/contentImageBg";
import Loader from "../../components/global/loader";
import Link from "next/link";
import TrainersSlider from "../../components/sliders/trainersSlider";
import {useRouter} from "next/router";
import loaderImg from "../../utils/loaderImg";
import Image from "next/image";
import loaderImgUrl from "../../utils/loaderImgUrl";

export default function schedule({api}) {
    /* eslint-disable react-hooks/rules-of-hooks */
    const router = useRouter();
    const {id} = router.query;
    const {role} = useSelector(state => state.user);
    const [dataEnroll, setDataEnroll] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [popupEnroll, setPopupEnroll] = useState(null);
    const [editStatus, setEditStatus] = useState(false);
    const [removeEventId, setRemoveEventId] = useState(null);
    const [textRefusal, setTextRefusal] = useState("");
    const [isAlert, setIsAlert] = useState(false);

    const onClickExportListCollaborators = () => {
        api("/ExportListCollaboratorsFromEvent", JSON.stringify({
            event_id: schedule.id
        })).then(res => {
            window.open(res.data, "_blank")
        })
    }

    const onClickEnroll = () => {
        api("/GetListEventsEduProgram", JSON.stringify({
            education_method_id: schedule.activity_id
        })).then(res => {
            setDataEnroll(res.data)
            setPopupEnroll(true)
        })
    }

    const onClickEditStatus = (e, status, eventId) => {
        if (status === "записаться") {
            api("/AddPersonFromEvent", JSON.stringify({
                event_id: eventId
            })).then((res) => {
                setPopupEnroll(false)
                if (res.data?.error){
                    // alert(res.data.error)
                    setIsAlert(true)
                } else {
                    alert("Успешно записан")
                }

            })
        }
        if (status === "уже записан") {
            setEditStatus(!editStatus)
            setRemoveEventId(eventId)
        }
    }

    const onMouseOverRemoveEvent = (e) => {
        if (e.target.innerHTML === "уже записан") {
            e.target.innerHTML = "отписаться"
            e.target.style.backgroundColor = "#7E9AB0"
        }
    }

    const onMouseOutRemoveEvent = (e) => {
        if (e.target.innerHTML === "отписаться" && !editStatus) {
            e.target.innerHTML = "уже записан"
            e.target.style.backgroundColor = "#FDAA5D"
        }
    }

    const onClickRemoveEvent = (e) => {
        api("/NotParticipatePersonFromEvent", JSON.stringify({
            event_id: String(removeEventId),
            comment: textRefusal
        })).then((res) => {
            setPopupEnroll(false)
            setEditStatus(!editStatus)
            setRemoveEventId("")
            alert("Успешно отписан")
        })
    }

    useEffect(() => {
        if (id) {
            api("/GetEventByID", JSON.stringify({id: String(id)})).then((res) => {
                setSchedule(res.data)
                setIsLoading(false)
            }).catch(err => {
                alert("Такого мероприятия не существует")
                router.push("/schedule")
            })
        }
    }, [id])

    return (
        <>
            <FlexTwo className="white">
                {isLoading ? (
                    <Loader height={800}/>
                ) : (
                    <>
                        {isAlert ? (
                          <div className="info__alert">
                              <button className="info__alert-cross info__cross" onClick={()=>setIsAlert(false)}><Image loader={loaderImg} src={`/assets/images/icons/cross-file.svg`} width={9} height={9} alt=""/></button>
                              <div className="info__alert-bg">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" viewBox="0 0 75 75" fill="none">
                                      <path d="M1 37.5C1 17.3416 17.3416 1 37.5 1C57.6584 1 74 17.3416 74 37.5C74 57.6584 57.6584 74 37.5 74C17.3416 74 1 57.6584 1 37.5Z" stroke="white" strokeWidth="2"/>
                                      <path d="M40.437 37.5003L55.6245 22.3128C55.9658 21.9143 56.1442 21.4016 56.1239 20.8773C56.1037 20.3529 55.8863 19.8556 55.5153 19.4845C55.1443 19.1135 54.6469 18.8962 54.1226 18.8759C53.5982 18.8556 53.0856 19.034 52.687 19.3753L37.4995 34.5628L22.312 19.3545C21.9135 19.0132 21.4008 18.8348 20.8765 18.8551C20.3522 18.8753 19.8548 19.0927 19.4838 19.4637C19.1128 19.8347 18.8954 20.3321 18.8751 20.8564C18.8549 21.3808 19.0332 21.8934 19.3745 22.292L34.562 37.5003L19.3537 52.6878C19.1356 52.8746 18.9585 53.1044 18.8334 53.3629C18.7084 53.6213 18.6381 53.9029 18.627 54.1898C18.616 54.4767 18.6643 54.7628 18.769 55.0301C18.8738 55.2975 19.0327 55.5403 19.2357 55.7433C19.4387 55.9464 19.6815 56.1052 19.9489 56.21C20.2162 56.3147 20.5023 56.363 20.7892 56.352C21.0761 56.3409 21.3577 56.2706 21.6161 56.1456C21.8746 56.0205 22.1044 55.8434 22.2912 55.6253L37.4995 40.4378L52.687 55.6253C53.0856 55.9666 53.5982 56.1449 54.1226 56.1247C54.6469 56.1044 55.1443 55.8871 55.5153 55.5161C55.8863 55.145 56.1037 54.6477 56.1239 54.1233C56.1442 53.599 55.9658 53.0863 55.6245 52.6878L40.437 37.5003Z" fill="white"/>
                                  </svg>
                              </div>
                              <div className="info__alert-content">
                                  <h1 className="info__alert-title">
                                      О, нет!
                                  </h1>
                                  <p className="info__alert-text">
                                      Ты не можешь записаться на одно мероприятие внутри одного месяца. <br/> Выбери другую дату
                                  </p>
                              </div>
                          </div>
                        ) : null}
                        <div className="schedule__bg-img">
                            <ContentImageBg img={schedule.image} title={schedule.title}>
                                <div className="schedule__bg-img-bts">
                                    <button className="button" onClick={onClickEnroll}>Записаться</button>
                                    {role !== "student" ? (
                                        <Link href={`/management/edit/${schedule.id}`}>
                                            <button className="button schedule__btn-gray">Редактировать</button>
                                        </Link>
                                    ) : null}
                                </div>
                                {dataEnroll.length > 0 && popupEnroll ? (
                                    <div className="schedule__popup-enroll">
                                        <h1 className="schedule__popup-title">Выбрать доступную дату</h1>
                                        <div className="schedule__popup-cross" onClick={() => setPopupEnroll(false)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"
                                                 viewBox="0 0 9 9" fill="none">
                                                <path
                                                    d="M5.08741 4.50011L8.12491 1.46261C8.19317 1.3829 8.22884 1.28037 8.22479 1.1755C8.22074 1.07064 8.17727 0.971164 8.10306 0.896958C8.02885 0.822752 7.92938 0.77928 7.82451 0.775229C7.71965 0.771179 7.61712 0.806848 7.53741 0.875109L4.49991 3.91261L1.46241 0.870942C1.3827 0.802681 1.28017 0.767012 1.1753 0.771063C1.07044 0.775113 0.970962 0.818585 0.896756 0.892791C0.82255 0.966997 0.779078 1.06647 0.775028 1.17134C0.770977 1.2762 0.806647 1.37873 0.874908 1.45844L3.91241 4.50011L0.870741 7.53761C0.827124 7.57496 0.791698 7.62093 0.766689 7.67262C0.741679 7.72432 0.727625 7.78062 0.725408 7.838C0.723192 7.89539 0.732861 7.95261 0.753809 8.00608C0.774756 8.05955 0.806531 8.10811 0.847137 8.14871C0.887743 8.18932 0.936304 8.22109 0.989773 8.24204C1.04324 8.26299 1.10046 8.27266 1.15785 8.27044C1.21523 8.26822 1.27153 8.25417 1.32323 8.22916C1.37492 8.20415 1.42089 8.16873 1.45824 8.12511L4.49991 5.08761L7.53741 8.12511C7.61712 8.19337 7.71965 8.22904 7.82451 8.22499C7.92938 8.22094 8.02885 8.17747 8.10306 8.10326C8.17727 8.02905 8.22074 7.92958 8.22479 7.82471C8.22884 7.71985 8.19317 7.61732 8.12491 7.53761L5.08741 4.50011Z"
                                                    fill="#315B7C"/>
                                            </svg>
                                        </div>
                                        <div className="schedule__popup-list">
                                            {dataEnroll.map((item, index) => {
                                                return (
                                                    <div key={index} className="schedule__popup-item">
                                                        <p className="schedule__popup-item-time">{item.time}</p>
                                                        <p className="schedule__popup-item-title">{item.title}</p>
                                                        <p className="schedule__popup-item-date">{item.date.split(".").reverse().join(".")}</p>
                                                        <p className="schedule__popup-item-status"
                                                           style={{backgroundColor: item.status === "уже записан" ? "#FDAA5D" : item.status === "нет мест" ? "#FF5561" : "#315B7C"}}
                                                           onClick={(e) => {
                                                               onClickEditStatus(e, item.status, item.id)
                                                           }} onMouseOver={onMouseOverRemoveEvent} onMouseOut={onMouseOutRemoveEvent}>{item.status}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {editStatus ? (
                                            <div className="schedule__popup-refusal">
                                                <div className="schedule__popup-item-title">Причина отказа от участия в мероприятии</div>
                                                <textarea id="info__desc" required placeholder="Не заполнено..." className="info__textarea" name="description" value={textRefusal} onChange={(e)=>setTextRefusal(e.target.value)}></textarea>
                                                <button className="button" onClick={onClickRemoveEvent}>Отписаться</button>
                                            </div>) : null}
                                    </div>
                                ) : null}
                            </ContentImageBg>
                        </div>

                        <h3 className="description__title">{schedule.title}</h3>
                        <p className="description__text">{schedule.description}</p>
                        <div className="schedule__block-time">
                            <div className="schedule__block-item">
                                <p className="schedule__block-title">Дата активности</p>
                                <div
                                    className="schedule__block-info">{schedule.start_date.split(".").reverse().join(".")}</div>
                            </div>
                            <div className="schedule__block-item">
                                <p className="schedule__block-title">Время активности</p>
                                <div className="schedule__block-info">{schedule.start_time}</div>
                            </div>
                        </div>
                        <h3 className="description__title">Длительность активности, мин</h3>
                        <ContentTimer time={schedule.time}/>
                        {schedule.training_files?.length > 0 ?
                            (
                                <>
                                    <h3 className="description__title">Дотренинговые материалы</h3>
                                    <div className="description__files">
                                        {
                                            schedule.training_files.map(file => {
                                                return (
                                                    <a href={file.url} target="_blank" rel="noreferrer" key={file.id}
                                                       className="description__file">
                                                        <Image loader={loaderImg} src={`/assets/images/icons/file-${file.type}.svg`} alt=""
                                                               width={45} height={45}/>
                                                    </a>)
                                            })
                                        }
                                    </div>
                                </>
                            )
                            : null}
                        {schedule.links?.length > 0 ?
                            (
                                <>
                                    <div className="description__links">
                                        {
                                            schedule.links.map((link, index) => {
                                                return (<a href={link.url} key={index} className="description__link"
                                                           target="_blank" rel="noreferrer">
                                                    {link.name}
                                                </a>)
                                            })
                                        }
                                    </div>
                                </>
                            )
                            : null}
                        {schedule.trainer_files?.length > 0 && role !== "student" ?
                            (
                                <>
                                    <h3 className="description__title">Материалы для тренера</h3>
                                    <div className="description__files">
                                        {
                                            schedule.trainer_files.map(file => {
                                                return (<a href={file.url} key={file.id} className="description__file"
                                                           target="_blank" rel="noreferrer">
                                                    <Image loader={loaderImg} src={`/assets/images/icons/file-${file.type}.svg`} alt=""
                                                           width={45} height={45}/>
                                                </a>)
                                            })
                                        }
                                    </div>
                                </>
                            )
                            : null}
                        <div className="description__qr-code description__qr-code-open">
                            <QRCodeSVG value={schedule.qrcode_link} size={130} fgColor="#315B7C"/>
                        </div>
                        <button className="button schedule__btn schedule__btn-gray schedule__btn-open"
                                onClick={() => navigator.clipboard.writeText(schedule.qrcode_link)}>
                            Копировать ссылку
                        </button>
                    </>
                )}
            </FlexTwo>
            <FlexOne className="white">
                {isLoading ? (
                    <Loader height={500}/>
                ) : (
                    <>
                        <TrainersSlider slides={schedule.trainer}/>
                        {schedule.collaborators?.length > 0 ? (
                            <>
                                <div className="schedule__description-title">
                                    <p className="management__title">Список участников
                                        ({schedule.collaborators.length})</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"
                                         fill="none" onClick={onClickExportListCollaborators}>
                                        <path
                                            d="M0.46875 9.28125C0.59307 9.28125 0.712299 9.33064 0.800206 9.41854C0.888114 9.50645 0.9375 9.62568 0.9375 9.75V12.0937C0.9375 12.3424 1.03627 12.5808 1.21209 12.7567C1.3879 12.9325 1.62636 13.0312 1.875 13.0312H13.125C13.3736 13.0312 13.6121 12.9325 13.7879 12.7567C13.9637 12.5808 14.0625 12.3424 14.0625 12.0937V9.75C14.0625 9.62568 14.1119 9.50645 14.1998 9.41854C14.2877 9.33064 14.4069 9.28125 14.5312 9.28125C14.6556 9.28125 14.7748 9.33064 14.8627 9.41854C14.9506 9.50645 15 9.62568 15 9.75V12.0937C15 12.591 14.8025 13.0679 14.4508 13.4196C14.0992 13.7712 13.6223 13.9687 13.125 13.9687H1.875C1.37772 13.9687 0.900806 13.7712 0.549175 13.4196C0.197544 13.0679 0 12.591 0 12.0937V9.75C0 9.62568 0.049386 9.50645 0.137294 9.41854C0.225201 9.33064 0.34443 9.28125 0.46875 9.28125Z"
                                            fill="#FF5561"/>
                                        <path
                                            d="M7.16823 11.1131C7.21177 11.1568 7.2635 11.1914 7.32045 11.215C7.3774 11.2387 7.43845 11.2508 7.5001 11.2508C7.56176 11.2508 7.62281 11.2387 7.67976 11.215C7.73671 11.1914 7.78844 11.1568 7.83198 11.1131L10.6445 8.30062C10.7325 8.21261 10.7819 8.09323 10.7819 7.96875C10.7819 7.84427 10.7325 7.72489 10.6445 7.63687C10.5565 7.54886 10.4371 7.49941 10.3126 7.49941C10.1881 7.49941 10.0687 7.54886 9.98073 7.63687L7.96885 9.64969V1.40625C7.96885 1.28193 7.91947 1.1627 7.83156 1.07479C7.74365 0.986886 7.62442 0.9375 7.5001 0.9375C7.37578 0.9375 7.25656 0.986886 7.16865 1.07479C7.08074 1.1627 7.03135 1.28193 7.03135 1.40625V9.64969L5.01948 7.63687C4.93146 7.54886 4.81208 7.49941 4.6876 7.49941C4.56313 7.49941 4.44375 7.54886 4.35573 7.63687C4.26771 7.72489 4.21826 7.84427 4.21826 7.96875C4.21826 8.09323 4.26771 8.21261 4.35573 8.30062L7.16823 11.1131Z"
                                            fill="#FF5561"/>
                                    </svg>
                                </div>
                                <div className="management__coach-block schedule__collaborators-block">
                                    {schedule.collaborators.map((collaborator, index) => {
                                        return (
                                            <label key={index} htmlFor={"management__coach-checkbox-" + index}>
                                                <div key={index} className="management__coach-item">
                                                    {(collaborator.avatar?.length > 0) ?
                                                      <Image loader={loaderImgUrl} src={collaborator?.url || collaborator?.avatar} alt="" className="management__coach-img" width={35} height={35}/>
                                                      : <div className="management__coach-noavatar"
                                                               style={{"background": collaborator?.gender === "m" ? "#315B7C" : "#FF5561"}}>{collaborator.firstname[0]}{collaborator.lastname[0]}</div>}
                                                    <p className="management__coach-text"
                                                       rel="noreferrer">{collaborator.firstname} {collaborator.lastname}</p>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            </>
                        ) : null}
                    </>
                )}
            </FlexOne>
        </>
    );
}