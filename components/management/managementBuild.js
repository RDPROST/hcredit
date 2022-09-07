import {useEffect, useState} from "react";
import DefaultButton from "../button/defaultButton";
import createFormData from "../../utils/createFormData";
import api from "../../utils/api";
import loaderImg from "../../utils/loaderImg";
import Image from "next/image";

export default function managementBuild({api}) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dataActivities, setDataActivities] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dataSearchCoach, setDataSearchCoach] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dataCoach, setDataCoach] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [searchCoach, setSearchCoach] = useState("");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dataSearchCollaborator, setDataSearchCollaborator] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dataCollaborator, setDataCollaborator] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [searchCollaborator, setSearchCollaborator] = useState("");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect( () => {
        const data = async () => {
            return await api("/GetInfoForCreateEvent")
                .then(res => res)
                .catch(err => console.log(err))
        }
        data().then(data => {
            if (data != null) {
                setDataActivities(data);
            }
        })
    },[])

    const onChangeSearchCoach = async (e) => {
        setSearchCoach(e.target.value);
        if (e.target.value.length >= 3) {
            await api("/GetLectorsForCreateEvent", JSON.stringify({
                search: e.target.value
            })).then(res => {
                setDataSearchCoach(res.data);
            }).catch(err => console.log(err))
        }
    }

    const onClickAddCoach = () => {
        setDataCoach([...dataCoach, dataSearchCoach[0]]);
        setDataSearchCoach([]);
        setSearchCoach("");
    }

    const onClickRemoveCoach = (id) => {
        setDataCoach(dataCoach.filter(item => item.id !== id));
    }

    const onChangeSearchCollaborator = async (e) => {
        setSearchCollaborator(e.target.value);
        if (e.target.value.length >= 3) {
            await api("/GetCollaboratorsForCreateEvent", JSON.stringify({
                search: e.target.value
            })).then(res => {
                setDataSearchCollaborator(res.data);
            }).catch(err => console.log(err))
        }
    }

    const onClickAddCollaborator = (e) => {
        if (e.key === "Enter"){
            e.preventDefault()
            setDataCollaborator([...dataCollaborator, dataSearchCollaborator[0]]);
            setDataSearchCollaborator([]);
            setSearchCollaborator("");
        }
    }

    const onClickRemoveCollaborator = (id) => {
        setDataCollaborator(dataCollaborator.filter(item => item.id !== id));
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const form_data = new FormData();
        const data = {
            activity_id: formData.get("activity"),
            lectors: dataCoach,
            collaborators: dataCollaborator,
            date: formData.get("date"),
            time: formData.get("time"),
            places: formData.get("places"),
            file: formData.get("file"),
            link: formData.get("link")
        }

        await createFormData(form_data, data, "request_data").then(async () => {
            await api("/CreateAppointEvent", form_data)
        })
    }
    return (
            <div className="management__build">
                <form action="#" className="management__form" onSubmit={onSubmit}>
                    <label htmlFor="management__activity" className="management__title">Выбрать обучающую активность</label>
                    <input autoComplete="off" type="text" placeholder="Не заполнено..." id="management__coach" list="management__coach-list" className="management__input" defaultValue={searchCoach} value={searchCoach} onChange={onChangeSearchCoach}/>
                    <datalist id="management__coach-list">
                        {dataActivities ? dataSearchCoach.map((activity, index) => {
                            return <option key={index} value={activity.title}>{activity.id}</option>
                        }) : null}
                    </datalist>
                    {/*<select name="activity" id="management__activity" placeholder="test" className="management__select" defaultValue="">*/}
                    {/*    <option value="" disabled>Не заполнено...</option>*/}
                    {/*    {dataActivities.data?.map((activity, index) => {*/}
                    {/*        return <option key={index} defaultValue={activity.id} value={activity.id}>{activity.title}</option>*/}
                    {/*    })}*/}
                    {/*</select>*/}
                    <label htmlFor="management__coach" className="management__title">Назначить тренера</label>
                    <div className="management__group">
                        <input autoComplete="off" type="text" placeholder="Введите ФИО" id="management__coach" list="management__coach-list" className="management__input" defaultValue={searchCoach} value={searchCoach} onChange={onChangeSearchCoach}/>
                        <datalist id="management__coach-list">
                            {dataSearchCoach ? dataSearchCoach.map((coach, index) => {
                                return <option key={index} value={coach.fullname}>{coach.id}</option>
                            }) : null}
                        </datalist>
                        <button className="management__btn" type={"button"} onClick={onClickAddCoach}>Добавить</button>
                    </div>
                    <div className="management__coach-block">
                        {dataCoach ? dataCoach.map((coach, index) => {
                            return (
                                <div key={index} className="management__coach-item">
                                    <p className="management__coach-text" rel="noreferrer">{coach.fullname}</p>
                                    <button className="management__coach-btn" onClick={()=>onClickRemoveCoach(coach.id)}>Удалить</button>
                                </div>
                            )
                        }) : null}
                    </div>
                    <label htmlFor="management__chanel" className="management__title">Выбрать канал связи</label>
                    <input type="text" placeholder="Вставить ссылку..." id="management__chanel" className="management__input" name="link"/>
                    <div className="management__group-comp">
                        <div className="management__group-item">
                            <label htmlFor="management__date" className="management__title">Выбрать дату</label>
                            <input type="date" id="management__date" className="management__input" name="date"/>
                        </div>
                        <div className="management__group-item">
                            <label htmlFor="management__time" className="management__title">Указать время</label>
                            <input type="time" id="management__time" className="management__input" name="time"/>
                        </div>
                        <div className="management__group-item">
                            <label htmlFor="management__places" className="management__title">Кол-во мест</label>
                            <input type="text" id="management__places" className="management__input" placeholder="30" name="places"/>
                        </div>
                    </div>
                    <label htmlFor="management__collaborator" className="management__title">Записать сотрудников</label>
                    <input autoComplete="off" type="text" list="management__collaborator-list" defaultValue={searchCollaborator} value={searchCollaborator}  id="management__collaborator" className="management__input" placeholder="Поиск по  ФИО или e-mail" onChange={onChangeSearchCollaborator} onKeyDown={onClickAddCollaborator}/>
                    <datalist id="management__collaborator-list">
                        {dataSearchCollaborator ? dataSearchCollaborator.map((collaborator, index) => {
                            return <option key={index} value={collaborator.fullname}>{collaborator.id}</option>
                        }) : null}
                    </datalist>
                    <div className="management__coach-block">
                        {dataCollaborator ? dataCollaborator.map((collaborator, index) => {
                            return (
                                <div key={index} className="management__coach-item">
                                    <p className="management__coach-text" rel="noreferrer">{collaborator.fullname}</p>
                                    <button className="management__coach-btn" onClick={()=>onClickRemoveCollaborator(collaborator.id)}>Удалить</button>
                                </div>
                            )
                        }) : null}
                    </div>
                    <label htmlFor="management__activity" className="management__title">Или загрузить список</label>
                    <div className="management__group-file">
                        <div className="management__group-file-item">
                            <input type="file" id="management__excel" className="management__file" name="file"/>
                            <label htmlFor="management__excel" className="management__file-label">
                                <span className="management__file-text">Выбрать Excel файл</span>
                                <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt="" className="management__file-img" width={58} height={53}/>
                            </label>
                        </div>
                        <div className="management__group-file-item">
                            <a href={dataActivities.sample_id} className="management__file-label">
                                <span className="management__file-text">Скачать образец</span>
                                <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt="" className="management__file-img" width={58} height={53}/>
                            </a>
                        </div>
                    </div>
                    <div className="management__btns">
                        <DefaultButton className="management__button management__button-gray" text="Очистить список участников"/>
                        <DefaultButton className="management__button" text="Назначить"/>
                    </div>
                </form>
            </div>
    )
}