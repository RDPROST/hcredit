import FlexTwo from "../../components/global/flexTwo";
import FlexOne from "../../components/global/flexOne";
import ManagementChoice from "../../components/management/managementChoice";
import ManagementBuild from "../../components/management/managementBuild";
import {useEffect, useState} from "react";
import createFormData from "../../utils/createFormData";
import DefaultButton from "../../components/button/defaultButton";
import {useRouter} from "next/router";
import api from "../../utils/api";
import TrainersSlider from "../../components/sliders/trainersSlider";
import loaderImg from "../../utils/loaderImg";
import Image from "next/image";
import loaderImgUrl from "../../utils/loaderImgUrl";
import Loader from "../../components/global/loader";

export default function Management({api}) {
    const router = useRouter();
    const action = "create";
    const [slide, setSlide] = useState(0);
    const [dataActivities, setDataActivities] = useState([]);
    const [dataSearchCoach, setDataSearchCoach] = useState([]);
    const [dataCoach, setDataCoach] = useState([]);
    const [searchCoach, setSearchCoach] = useState("");
    const [dataSearchCollaborator, setDataSearchCollaborator] = useState([]);
    const [dataCollaborator, setDataCollaborator] = useState([]);
    const [searchCollaborator, setSearchCollaborator] = useState("");
    const [activeChoice, setActiveChoice] = useState(3);
    const [activityValue, setActivityValue] = useState(router.query.id);
    const [searchActivity, setSearchActivity] = useState("");
    const [isSearchCoach, setIsSearchCoach] = useState(false)
    const [isSearchCollaborator, setIsSearchCollaborator] = useState(false)
    const [excelChange, setExcelChange] = useState(false);
    const [isSubmit, setIsSubmit] = useState(false)
    useEffect(() => {
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
    }, [])

    const onChangeSearchCoach = async (e) => {
        setSearchCoach(e.target.value);
        if (e.target.value.length >= 3) {
            setIsSearchCoach(true)
            await api("/GetLectorsForCreateEvent", JSON.stringify({
                search: e.target.value
            })).then(res => {
                setDataSearchCoach(res.data);
                setIsSearchCoach(false)
            }).catch(err => console.log(err))
        }
    }

    const onChangeSearchActivity = async (e) => {
        setSearchActivity(e.target.value);
    }

    const onClickAddCoach = (e) => {
        if (e.target.type === "button" || e.code === "Enter") {
            if (!JSON.stringify(dataCoach).includes(JSON.stringify(dataSearchCoach[0]))) {
                if (searchCoach.length > 3 && dataSearchCoach.length > 0) {
                    setDataCoach([...dataCoach, dataSearchCoach[0]]);
                    setDataSearchCoach([]);
                    setSearchCoach("");
                }
            } else {
                setDataSearchCoach([]);
                setSearchCoach("");
                alert("Тренер уже добавлен")
            }
        }
    }

    const onClickRemoveCoach = (id) => {
        setDataCoach(dataCoach.filter(item => item.id !== id));
    }

    const onChangeSearchCollaborator = async (e) => {
        setSearchCollaborator(e.target.value);
        if (e.target.value.length >= 3) {
            setIsSearchCollaborator(true)
            await api("/GetCollaboratorsForCreateEvent", JSON.stringify({
                search: e.target.value
            })).then(res => {
                setDataSearchCollaborator(res.data);
                setIsSearchCollaborator(false);
            }).catch(err => console.log(err))
        }
    }

    const onClickAddCollaborator = (e) => {
        if (e.target.type === "button" || e.code === "Enter") {
            if (!JSON.stringify(dataCollaborator).includes(JSON.stringify(dataSearchCollaborator[0]))) {
                if (searchCollaborator.length > 3 && dataSearchCollaborator.length > 0) {
                    setDataCollaborator([...dataCollaborator, dataSearchCollaborator[0]]);
                    setDataSearchCollaborator([]);
                    setSearchCollaborator("");
                }
            } else {
                setDataSearchCollaborator([]);
                setSearchCollaborator("");
                alert("Сотрудник уже добавлен")
            }
        }
    }

    const onClickRemoveCollaborator = (id) => {
        setDataCollaborator(dataCollaborator.filter(item => item.id !== id));
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsSubmit(true);
        const formData = new FormData(e.target);
        const form_data = new FormData();
        const file = formData.get("file");
        const data = {
            action: action,
            activity_id: dataActivities.data.find(item => item.title === formData.get("activity")).id,
            lectors: dataCoach,
            collaborators: dataCollaborator,
            date: formData.get("date"),
            time: formData.get("time"),
            places: formData.get("places"),
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                data: file
            },
            link: formData.get("link")
        }

        if (dataCoach.length === 0) {
            alert("Необходимо добавить тренера")
            return
        }

        await createFormData(form_data, data, "request_data").then(async () => {
            await api("/CreateAppointEvent", form_data).then(res => {
                if (res.success) {
                    router.push("/schedule")
                } else {
                    alert("Ошибка при добавлении записи");
                }
                setIsSubmit(false);

            }).catch(err => console.log(err))
        })
    }

    const onClickRemoveAllCollaborator = () => {
        setDataCollaborator([]);
    }

    const onChangeExcelCollaborator = async (e) => {
        setExcelChange(true);
        const file = e.target.files[0];
        let form_data = new FormData()
        let data = {
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                data: file
            }
        }
        await createFormData(form_data, data, "request_data").then(async () => {
            await api("/AddPersonToEventFromExcel", form_data).then(res => res.data).then(res => {
                res.forEach(person =>{
                    if (!JSON.stringify(dataCollaborator).includes(JSON.stringify(person))){
                        setDataCollaborator([...dataCollaborator, person]);
                    }
                })
                setExcelChange(false);
            })
        })
    }
    return (
        <>
            <FlexTwo className="white">
                {isSubmit ? <Loader height={1250} /> : (
                  <>
                      <ManagementChoice activeChoice={activeChoice} setActiveChoice={setActiveChoice}/>
                      {activeChoice === 3 ?
                        (
                          <>
                              <div className="management__build">
                                  <form action="#" className="management__form" onSubmit={onSubmit}>
                                      <label htmlFor="management__activity" className="management__title">Выбрать
                                          обучающую
                                          активность</label>
                                      <input autoComplete="off" type="text" placeholder="Не заполнено..." id="management__coach" list="management__activity-list" className="management__input" defaultValue={searchActivity} value={searchActivity} onChange={onChangeSearchActivity} name="activity"/>
                                      <datalist id="management__activity-list">
                                          {dataActivities ? dataActivities.data?.map((activity, index) => {
                                              return <option key={index} value={activity.title}>{activity.code}</option>
                                          }) : null}
                                      </datalist>
                                      {/*<select name="activity" id="management__activity" placeholder="test" className="management__select" defaultValue="">*/}
                                      {/*    <option value="" disabled>Не заполнено...</option>*/}
                                      {/*    {dataActivities.data?.map((activity, index) => {*/}
                                      {/*        return <option key={index} defaultValue={activity.id} value={activity.id}>{activity.title}</option>*/}
                                      {/*    })}*/}
                                      {/*</select>*/}
                                      <label htmlFor="management__coach" className="management__title">Назначить
                                          тренера</label>
                                      <div className="management__group">
                                          <input autoComplete="off" type="text" placeholder="Введите ФИО"
                                                 id="management__coach"
                                                 list="management__coach-list" className="management__input"
                                                 defaultValue={searchCoach} value={searchCoach}
                                                 onChange={onChangeSearchCoach} onKeyDown={onClickAddCoach}/>
                                          <datalist id="management__coach-list">
                                              {dataSearchCoach ? dataSearchCoach.map((coach, index) => {
                                                  return <option key={index} value={coach.fullname}>{coach.code}</option>
                                              }) : null}
                                          </datalist>
                                          <button className="management__btn" type={"button"}
                                                  onClick={isSearchCoach ? "" : onClickAddCoach}>
                                              {isSearchCoach ? <Loader minLoader={true} height={50}/> : "Добавить"}
                                          </button>
                                      </div>
                                      <div className="management__coach-block">
                                          {dataCoach ? dataCoach.map((coach, index) => {
                                              return (
                                                <div key={index} className="management__coach-item">
                                                    <p className="management__coach-text"
                                                       rel="noreferrer">{coach.fullname}</p>
                                                    <button className="management__coach-btn"
                                                            onClick={() => onClickRemoveCoach(coach.id)}>Удалить
                                                    </button>
                                                </div>
                                              )
                                          }) : null}
                                      </div>
                                      <label htmlFor="management__chanel" className="management__title">Выбрать канал
                                          связи</label>
                                      <input type="text" placeholder="Вставить ссылку..." id="management__chanel"
                                             className="management__input" name="link" required/>
                                      <div className="management__group-comp">
                                          <div className="management__group-item">
                                              <label htmlFor="management__date" className="management__title">Выбрать
                                                  дату</label>
                                              <input type="date" id="management__date" className="management__input"
                                                     name="date" required/>
                                          </div>
                                          <div className="management__group-item">
                                              <label htmlFor="management__time" className="management__title">Указать
                                                  время</label>
                                              <input type="time" id="management__time" className="management__input"
                                                     name="time" required/>
                                          </div>
                                          <div className="management__group-item">
                                              <label htmlFor="management__places" className="management__title">Кол-во
                                                  мест</label>
                                              <input type="number" id="management__places" className="management__input"
                                                     placeholder="30" name="places" min="0" required/>
                                          </div>
                                      </div>
                                      <label htmlFor="management__collaborator" className="management__title">Записать
                                          сотрудников</label>
                                      <div className="management__group">
                                          <input autoComplete="off" type="text" list="management__collaborator-list"
                                                 defaultValue={searchCollaborator} value={searchCollaborator}
                                                 id="management__collaborator" className="management__input"
                                                 placeholder="Поиск по  ФИО или e-mail"
                                                 onChange={onChangeSearchCollaborator}
                                                 onKeyDown={onClickAddCollaborator}/>
                                          <datalist id="management__collaborator-list">
                                              {dataSearchCollaborator ? dataSearchCollaborator.map((collaborator, index) => {
                                                  return <option key={index}
                                                                 value={collaborator.fullname}>{collaborator.code}</option>
                                              }) : null}
                                          </datalist>
                                          <button className="management__btn" type={"button"}
                                                  onClick={onClickAddCollaborator}>
                                              {isSearchCollaborator ? <Loader minLoader={true} height={50}/> : "Добавить"}
                                          </button>
                                      </div>


                                      <label htmlFor="management__activity" className="management__title">Или загрузить
                                          список</label>
                                      <div className="management__group-file">
                                          <div className="management__group-file-item">
                                              <input type="file" id="management__excel" className="management__file"
                                                     name="file"
                                                     accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                                     onChange={onChangeExcelCollaborator}/>
                                              <label htmlFor="management__excel" className="management__file-label">
                                                  <span className="management__file-text">Выбрать Excel файл</span>
                                                  <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt=""
                                                         className="management__file-img" width={58} height={53}/>
                                              </label>
                                          </div>
                                          <div className="management__group-file-item">
                                              <a href={dataActivities.sample_id} className="management__file-label" onClick={dataActivities.sample_id == "" ? (e)=>e.preventDefault() : null}>
                                                  <span className="management__file-text">{dataActivities.sample_id == "" ? "Нет Excel образца": "Скачать образец"}</span>
                                                  <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt=""
                                                         className="management__file-img" width={58} height={53}/>
                                              </a>
                                          </div>
                                      </div>
                                      <div className="management__btns">
                                          <DefaultButton className="management__button management__button-gray"
                                                         text="Очистить список участников"
                                                         onClick={onClickRemoveAllCollaborator}
                                                         type="button"/>
                                          <DefaultButton className="management__button" text="Назначить" type={"submit"}/>
                                      </div>
                                  </form>
                              </div>
                          </>) : <h1>В разработке</h1>}
                  </>
                )
                 }
            </FlexTwo>
            {isSubmit ? <FlexOne/> : <FlexOne className={dataCollaborator.length > 0 || dataCoach.length > 0 ? "white" : ""}>
                  <TrainersSlider slides={dataCoach}/>
                  {excelChange ? <Loader height={150} /> : null}
                  {dataCollaborator.length > 0 ? (
                    <>
                        <p className="management__title">Список участников ({dataCollaborator.length || 0})</p>
                        <div className="management__coach-block">
                            {dataCollaborator.map((collaborator, index) => {
                                return (
                                  <div key={index} className="management__coach-item">
                                      {(collaborator.url.length > 0) ?
                                        <Image loader={loaderImgUrl} src={collaborator?.url || collaborator?.avatar} alt="" className="management__coach-img" width={35} height={35}/>
                                        : <div className="management__coach-noavatar"
                                               style={{"background": collaborator.gender === "m" ? "#315B7C" : "#FF5561"}}>{collaborator.firstname[0]}{collaborator.lastname[0]}</div>}
                                      <p className="management__coach-text"
                                         rel="noreferrer">{collaborator.firstname} {collaborator.lastname}</p>
                                      <button className="management__coach-btn"
                                              onClick={() => onClickRemoveCollaborator(collaborator.id)}>Удалить
                                      </button>
                                  </div>
                                )
                            })}
                        </div>
                    </>
                  ) : null}

              </FlexOne>
            }
        </>
    )
}