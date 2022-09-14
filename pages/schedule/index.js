import {QRCodeSVG} from 'qrcode.react';
import FlexTwo from "../../components/global/flexTwo";
import FlexOne from "../../components/global/flexOne";
import {useSelector} from "react-redux";
import {useEffect, useRef, useState} from "react";
import ContentTimer from "../../components/content/contentTimer";
import Image from "next/image";
import ScheduleSelect from "../../components/select/scheduleSelect";
import ContentImageBg from "../../components/content/contentImageBg";
import Loader from "../../components/global/loader";
import Link from "next/link";
import Select from "react-select";
import loaderImgUrl from "../../utils/loaderImgUrl";

export default function schedule({api}) {
    /* eslint-disable react-hooks/rules-of-hooks */
    const {role} = useSelector(state => state.user);
    const [dataSchedules, setDataSchedules] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [visitCollaborator, setVisitCollaborator] = useState(schedule.collaborators || []);
    const [isLoading, setIsLoading] = useState(true);
    const [popupStartDate, setPopupStartDate] = useState("");
    const [popupEndDate, setPopupEndDate] = useState("");
    const [popupFilter, setPopupFilter] = useState(false);
    const [popupFilterOption, setPopupFilterOption] = useState(false);
    const [coachData, setCoachData] = useState("");
    const [coachId, setCoachId] = useState([]);
    const [coachIds, setCoachIds] = useState([]);
    const [pages, setPages] = useState(0);
    const [pageEndDate, setPageEndDate] = useState(null);
    const [dataSelectStatus, setDataSelectStatus] = useState([]);
    const [statusSend, setStatusSend] = useState("");
    const [scrollTop, setScrollTop] = useState(0);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const scheduleList = useRef(null);
    const [maxHeight, setMaxHeight] = useState(450);
    const [isExportingList, setIsExportingList] = useState(false);

    const dataStatus = [
        {
            label: "Ожидается",
            value: "plan"
        },
        {
            label: "В процессе",
            value: "active"
        },
        {
            label: "Завершено",
            value: "close"
        },
        {
            label: "Отменено",
            value: "cancel"
        }
    ]

    const collaboratorsEnding = (num) => {
        let arr = ["участник", "участника", "участников"]
        let result = ""

        if (num % 100 >= 5 && num % 100 <= 20) {
            result = `${num} ${arr[2]}`
        } else if (num % 10 === 1) {
            result = `${num} ${arr[0]}`
        } else if (num % 10 >= 2 && num % 10 <= 4) {
            result = `${num} ${arr[1]}`
        } else {
            result = `${num} ${arr[2]}`
        }
        return result
    }

    const setScheduleById = (id) => {
        setSchedule(dataSchedules.find(schedule => schedule.id === id))
        setVisitCollaborator(dataSchedules.find(schedule => schedule.id === id).collaborators)
        setScrollTop(window.scrollY - 110 > 0 ? window.scrollY - 110 : 0)
    }

    const onChangeVisitCollaborator = (e, id) => {
        let newVisitCollaborator = visitCollaborator.map(visit => {
            if (visit.id === id) {
                visit.marked = e.target.checked
            }
            return visit
        })
        setVisitCollaborator(newVisitCollaborator)
    }

    const onClickMarkAsVisited = () => {
        api("/AssistCollaboratorsEvent", JSON.stringify({
            event_id: schedule.id,
            collaborators: visitCollaborator
        }))
    }


    const setStatusSchedule = (id, status) => {
        dataSchedules.forEach(schedule => {
            if (schedule.id === id) {
                schedule.status = status
            }
        })
        setDataSchedules(dataSchedules)
    }

    const onClickExportListCollaborators = () => {
        setIsExportingList(true)
        api("/ExportListCollaboratorsFromEvent", JSON.stringify({
            event_id: schedule.id
        })).then(res => {
            window.open(res.data, "_blank")
            setIsExportingList(false)
        })
    }

    const onChangeMultiSelect = (e) => {
        let coachIds = [];
        let coachData = [];
        e.forEach(item => {
            coachIds.push(item);
            coachData.push(item.id)
        })
        setCoachId(coachIds);
        setCoachIds(coachData);
    }

    const onChangeMultiSelectStatus = (e) => {
        let dataStatus = [];
        let status = "";
        e.forEach(item => {
            dataStatus.push(item);
            status += item.value + ","
        })
        setDataSelectStatus(dataStatus);
        setStatusSend(status.slice(0, -1));
    }

    const onScrollList = (event) => {
        const scrollBottom = Math.ceil(event.target.scrollTop + event.target.offsetHeight) === event.target.scrollHeight;
        if (scrollBottom && !popupFilter) {
            onLoadListEvents(true)
            setIsLoadingList(true);
        }
    }

    const onClickSearchFilter = () => {
        onLoadListEvents(false, "", true)
        setPopupFilterOption(!popupFilterOption)
        setPopupFilter(true)
    }

    const onClickSearchFilterClear = () => {
        onLoadListEvents()
        api("/GetTrainersForEvent", JSON.stringify({null: "null"})).then((res) => {
            res.data.forEach(item => {
                item.value = item.id;
                item.label = item.fullname;
            })
            setCoachData(res.data)
        })
        setPopupStartDate("");
        setPopupEndDate("");
        setDataSelectStatus([]);
        setPopupFilter(false)
        setCoachId([]);
        setCoachIds([]);
    }

    const onChangeSearchFilter = (e) => {
        if (e.target.value.length >= 3) {
            onLoadListEvents(false, e.target.value, true)
            setPopupFilter(true)
        } else {
            onLoadListEvents(false)
            setPopupFilter(false)
        }
    }

    const onLoadListEvents = (scroll = false, search = "", filter = false) => {
        let obj = {
            filters: {
                startDate: popupStartDate,
                endDate: popupEndDate,
                status: statusSend,
                coachId: coachIds,
                search: search
            }
        }
        if (scroll) {
            obj.filters.pages = pages
        }
        api("/GetListEvents", JSON.stringify(obj))
            .then(res => {
                res = res.data.sort((a, b) => new Date(`${a.start_date.replaceAll(".", "-")}T${a.start_time}:00`) - new Date(`${b.start_date.replaceAll(".", "-")}T${b.start_time}:00`))
                if (res.length > 0) {
                    if (!scroll) {
                        setSchedule(res[0])
                        setVisitCollaborator(res[0].collaborators)
                    }
                }
                return res
            })
            .then((filteredRes = []) => {
                let filterValue = -1
                let filterDate;
                if (filter) {
                    for (let i = 0; i < filteredRes.length; i++) {
                        filterDate = filteredRes[i].start_date;
                        if (filteredRes[0].start_date !== (filteredRes[i].start_date && filterDate)) {
                            filterValue++
                        }
                    }
                }
                let diffDays = 5;
                let curArr = []
                let filterEndDate;
                let endDate = scroll ? new Date(pageEndDate).setDate(new Date(pageEndDate).getDate() + diffDays) : new Date().setDate(new Date().getDate() + diffDays)
                if (!filter) {
                    for (let i = 0; i < diffDays; i++) {
                        let curDate = scroll ? new Date(new Date(pageEndDate).setDate(new Date(pageEndDate).getDate() + i)) : filter ? new Date(filteredRes[i]?.start_date) : new Date(new Date().setDate(new Date().getDate() + i))
                        let obj = [{
                            name: curDate.toLocaleString('ru', {
                                day: 'numeric',
                                month: 'long'
                            })
                        }]
                        let goodArr = filteredRes.filter(schedule => new Date(schedule.start_date.replaceAll(".", "-")).getDate() === new Date(new Date(curDate).setHours(0, 0, 0, 0)).getDate()) || []
                        curArr = [...curArr, ...obj.concat(goodArr)]
                    }
                } else {
                    for (let i = 0; i <= filteredRes.length - 1; i++) {
                        let curDate = filter ? new Date(filteredRes[i]?.start_date) : new Date(new Date().setDate(new Date().getDate() + i))
                        if (curDate.getDate() !== new Date(filterEndDate).getDate()) {
                            let obj = [{
                                name: curDate.toLocaleString('ru', {
                                    day: 'numeric',
                                    month: 'long'
                                })
                            }]
                            let goodArr = filteredRes.filter(schedule => new Date(schedule.start_date).getTime() === new Date(curDate).setHours(0, 0, 0, 0)) || []
                            curArr = [...curArr, ...obj.concat(goodArr)]
                        }
                        filterEndDate = new Date(filteredRes[i]?.start_date)
                    }
                }
                setPageEndDate(new Date(endDate).setDate(new Date(endDate).getDate()) + 1)
                setDataSchedules(scroll ? [...dataSchedules, ...curArr] : curArr)
                setPages(scroll ? pages + 1 : 1)
                setIsLoadingList(false);
            })
    }

    useEffect(() => {
        if (dataSchedules.length > 0 && maxHeight === 450) {
            let children = Array.from(scheduleList.current.children)
            let totalHeight = 0;
            children.forEach(child => {
                totalHeight += child.clientHeight + 5
            })
            setMaxHeight(totalHeight);
        }
    }, [dataSchedules]);


    useEffect(() => {
        onLoadListEvents()
        setIsLoading(false)

        api("/GetTrainersForEvent", JSON.stringify({null: "null"})).then((res) => {
            res.data.forEach(item => {
                item.value = item.id;
                item.label = item.fullname;
            })
            setCoachData(res.data)
        })
    }, [])

    return (
        <>
            <FlexTwo className="white">
                {isLoading ? (
                    <Loader height={800}/>
                ) : (
                    <>
                        <ContentImageBg img="/assets/images/schedule.jpeg"
                                        title="Расписание" bg={true}/>
                        <div className="schedule__filter">
                            <div className="info__group">
                                <input type="text" placeholder="Поиск по активностям..."
                                       className="info__input schedule__filter-input" onChange={onChangeSearchFilter}/>
                                <button className="info__btn schedule__filter-btn" type={"button"} onClick={() => {
                                    setPopupFilterOption(!popupFilterOption)
                                    setPopupFilter(false)
                                }}>Настроить фильтры
                                </button>
                            </div>
                            {popupFilterOption ? (
                                <div className="popup-filter">
                                    <div className="popup-filter__block">
                                        <label className="popup-filter__title management__title" htmlFor="coach">Выбрать
                                            тренера</label>
                                        <div className="popup-custom__select">
                                            <Select
                                                isMulti
                                                name="coach"
                                                options={coachData || []}
                                                onChange={onChangeMultiSelect}
                                                placeholder="Не заполнено..."
                                                value={coachId}
                                            />
                                        </div>
                                    </div>
                                    <div className="popup-filter__block">
                                        <label htmlFor="management__date"
                                               className="popup-filter__title management__title">Выбрать
                                            дату</label>
                                        <div className="popup-filter__block-date">
                                            <input type="date" id="management__date"
                                                   className="management__input popup-filter__date"
                                                   name="date" value={popupStartDate}
                                                   onChange={(e) => setPopupStartDate(e.target.value)}/>
                                            <p className="popup-filter__block-dash">
                                                –
                                            </p>
                                            <input type="date" id="management__date"
                                                   className="management__input popup-filter__date"
                                                   name="date" value={popupEndDate}
                                                   onChange={(e) => setPopupEndDate(e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="popup-filter__block">
                                        <label className="popup-filter__title management__title" htmlFor="status">Поиск
                                            по статусу</label>
                                        <div className="popup-custom__select">
                                            <Select
                                                isMulti
                                                name="status"
                                                options={dataStatus || []}
                                                onChange={onChangeMultiSelectStatus}
                                                placeholder="Не заполнено..."
                                                value={dataSelectStatus}
                                            />
                                        </div>
                                        {/*<select name="coach" id="status" placeholder="test"*/}
                                        {/*        className="management__select" onChange={(e)=> setPopupStatus(e.target.value)} value={popupStatus}>*/}
                                        {/*    <option value="" disabled selected>Не заполнено...</option>*/}
                                        {/*    <option value="plan">Ожидается</option>*/}
                                        {/*    <option value="active">В процессе</option>*/}
                                        {/*    <option value="close">Завершено</option>*/}
                                        {/*    <option value="cancel">Отменено</option>*/}
                                        {/*</select>*/}
                                    </div>
                                    <div className="popup-filter__block-btns">
                                        <button className="button schedule__btn schedule__btn-gray"
                                                onClick={onClickSearchFilterClear}>
                                            Сбросить
                                        </button>
                                        <button className="button schedule__btn schedule__btn-mt"
                                                onClick={onClickSearchFilter}>
                                            Найти
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="schedule__list" onScroll={onScrollList} ref={scheduleList} style={{maxHeight: maxHeight}}>
                            {dataSchedules.length > 0 ? dataSchedules.map((item, index, arr) => {
                                if (item?.name) {
                                    return (
                                        <div key={index}>
                                            <h1 className="schedule__date">{item.name}</h1>
                                            {item?.name && !arr[index + 1]?.title ? <p className="schedule__text">
                                                Нет мероприятий
                                            </p> : null}
                                        </div>
                                    )
                                }

                                return (
                                    <div key={index}
                                         className={"schedule__item " + (schedule.id === item.id ? "schedule__item_active" : "")}
                                         onClick={() => {
                                             setScheduleById(item.id)
                                         }}>
                                        <p className="schedule__start-time">{item.start_time}</p>
                                        <p className="schedule__title">{item.title}</p>
                                        <p className="schedule__collaborators">{`${item.collaborators.length} / ${collaboratorsEnding(item?.places || 0)}`}</p>
                                        <ScheduleSelect status={item.state_id} makers={item.trainer} eventId={item.id}
                                                        api={api} setStatusSchedule={setStatusSchedule}/>
                                        {item.trainer[0]?.avatar ?
                                            <Image loader={loaderImgUrl} className="schedule__img" src={item.trainer[0]?.avatar} alt=""
                                                 width={35} height={35}/> : <div className="management__coach-noavatar"
                                                                                 style={{"background": item.trainer[0]?.gender === "m" ? "#315B7C" : "#FF5561"}}>{item.trainer[0]?.firstname[0]}{item.trainer[0]?.lastname[0]}</div>}
                                    </div>
                                )
                            }) : (
                                <div className="schedule__none-search">
                                    <p className="schedule__text">
                                        Поиск не дал результатов
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </FlexTwo>
            <FlexOne className={schedule?.title ? "white" : ""} style={{position:'relative', top: scrollTop}}>
                {isLoading ? (
                    <Loader height={500}/>
                ) : (
                    <>

                        {schedule?.title ? (
                                <div className="test">
                                    <h3 className="description__title">{schedule.title}</h3>
                                    <img
                                        src={schedule.image}
                                        alt="" className="description__img"/>
                                    <p className="description__text"
                                       dangerouslySetInnerHTML={{__html: schedule.description}}></p>
                                    <h3 className="description__title">Длительность активности, мин</h3>
                                    <ContentTimer time={schedule.time}/>
                                    {schedule.training_files?.length > 0 ?
                                        (
                                            <>
                                                <h3 className="description__title">Дотренинговые материалы</h3>
                                                <div className="description__files">
                                                    {
                                                        schedule.training_files.map(file => {
                                                            return (<a href={file.url} target="_blank" rel="noreferrer"
                                                                       key={file.id} className="description__file">
                                                                <Image
                                                                    src={`/assets/images/icons/file-${file.type}.svg`}
                                                                    alt="" width={45} height={45}/>
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
                                                            return (<a href={link.url} key={index}
                                                                       className="description__link" target="_blank"
                                                                       rel="noreferrer">
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
                                                            return (<a href={file.url} key={file.id}
                                                                       className="description__file" target="_blank"
                                                                       rel="noreferrer">
                                                                <Image
                                                                    src={`/assets/images/icons/file-${file.type}.svg`}
                                                                    alt="" width={45} height={45}/>
                                                            </a>)
                                                        })
                                                    }
                                                </div>
                                            </>
                                        )
                                        : null}
                                    <div className="description__qr-code">
                                        <QRCodeSVG value={schedule.qrcode_link} size={130} fgColor="#315B7C"/>
                                    </div>
                                    <button className="button schedule__btn"
                                            onClick={() => navigator.clipboard.writeText(schedule.qrcode_link)}>
                                        Копировать ссылку
                                    </button>
                                    {visitCollaborator?.length > 0 ? (
                                        <>
                                            <div className="schedule__description-title">
                                                <p className="management__title">Список участников
                                                    ({schedule.collaborators.length})</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                                                     viewBox="0 0 15 15" fill="none"
                                                     onClick={onClickExportListCollaborators}>
                                                    <path
                                                        d="M0.46875 9.28125C0.59307 9.28125 0.712299 9.33064 0.800206 9.41854C0.888114 9.50645 0.9375 9.62568 0.9375 9.75V12.0937C0.9375 12.3424 1.03627 12.5808 1.21209 12.7567C1.3879 12.9325 1.62636 13.0312 1.875 13.0312H13.125C13.3736 13.0312 13.6121 12.9325 13.7879 12.7567C13.9637 12.5808 14.0625 12.3424 14.0625 12.0937V9.75C14.0625 9.62568 14.1119 9.50645 14.1998 9.41854C14.2877 9.33064 14.4069 9.28125 14.5312 9.28125C14.6556 9.28125 14.7748 9.33064 14.8627 9.41854C14.9506 9.50645 15 9.62568 15 9.75V12.0937C15 12.591 14.8025 13.0679 14.4508 13.4196C14.0992 13.7712 13.6223 13.9687 13.125 13.9687H1.875C1.37772 13.9687 0.900806 13.7712 0.549175 13.4196C0.197544 13.0679 0 12.591 0 12.0937V9.75C0 9.62568 0.049386 9.50645 0.137294 9.41854C0.225201 9.33064 0.34443 9.28125 0.46875 9.28125Z"
                                                        fill="#FF5561"/>
                                                    <path
                                                        d="M7.16823 11.1131C7.21177 11.1568 7.2635 11.1914 7.32045 11.215C7.3774 11.2387 7.43845 11.2508 7.5001 11.2508C7.56176 11.2508 7.62281 11.2387 7.67976 11.215C7.73671 11.1914 7.78844 11.1568 7.83198 11.1131L10.6445 8.30062C10.7325 8.21261 10.7819 8.09323 10.7819 7.96875C10.7819 7.84427 10.7325 7.72489 10.6445 7.63687C10.5565 7.54886 10.4371 7.49941 10.3126 7.49941C10.1881 7.49941 10.0687 7.54886 9.98073 7.63687L7.96885 9.64969V1.40625C7.96885 1.28193 7.91947 1.1627 7.83156 1.07479C7.74365 0.986886 7.62442 0.9375 7.5001 0.9375C7.37578 0.9375 7.25656 0.986886 7.16865 1.07479C7.08074 1.1627 7.03135 1.28193 7.03135 1.40625V9.64969L5.01948 7.63687C4.93146 7.54886 4.81208 7.49941 4.6876 7.49941C4.56313 7.49941 4.44375 7.54886 4.35573 7.63687C4.26771 7.72489 4.21826 7.84427 4.21826 7.96875C4.21826 8.09323 4.26771 8.21261 4.35573 8.30062L7.16823 11.1131Z"
                                                        fill="#FF5561"/>
                                                </svg>
                                            </div>
                                            <div className="management__coach-block schedule__collaborators-block">
                                                {isExportingList ? <Loader height={150} /> :
                                                  visitCollaborator.map((collaborator, index) => {
                                                          return (
                                                            <label key={index}
                                                                   htmlFor={"management__coach-checkbox-" + index}>
                                                                <div key={index} className="management__coach-item">
                                                                    {(collaborator.avatar?.length > 0) ?
                                                                      <Image loader={loaderImgUrl} src={collaborator?.url || collaborator?.avatar} alt="" className="management__coach-img" width={35} height={35}/>
                                                                      : <div className="management__coach-noavatar"
                                                                             style={{"background": collaborator?.gender === "m" ? "#315B7C" : "#FF5561"}}>{collaborator.firstname[0]}{collaborator.lastname[0]}</div>}
                                                                    <p className="management__coach-text"
                                                                       rel="noreferrer">{collaborator.firstname} {collaborator.lastname}</p>
                                                                    {role !== "student" ? (
                                                                      <div className="management__block-checkbox">
                                                                          <input type="checkbox"
                                                                                 className="management__coach-checkbox"
                                                                                 id={"management__coach-checkbox-" + index}
                                                                                 onChange={(e) => onChangeVisitCollaborator(e, collaborator.id)}
                                                                                 checked={Boolean(Number(collaborator.marked))}/>
                                                                          <span
                                                                            className="management__coach-checkmark"></span>
                                                                      </div>
                                                                    ) : null}
                                                                </div>
                                                            </label>
                                                          )
                                                      })
                                                }
                                            </div>
                                            {role !== "student" ? (
                                                <button className="button schedule__btn schedule__btn-gray"
                                                        onClick={onClickMarkAsVisited}>
                                                    Отметить посещение
                                                </button>
                                            ) : null}

                                        </>
                                    ) : null}
                                    <Link href={`/schedule/${schedule.id}`}>
                                        <button className="button schedule__btn schedule__btn-mt">
                                            Перейти к мероприятию
                                        </button>
                                    </Link>
                                </div>
                            ) : null}
                    </>
                )}
            </FlexOne>
        </>
    );
}
