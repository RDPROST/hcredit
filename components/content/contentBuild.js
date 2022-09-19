import {useEffect, useRef, useState} from 'react';
import Image from "next/image";
import api from "../../utils/api";
import DefaultButton from "../button/defaultButton";
import {useSelector} from "react-redux";
import createFormData from "../../utils/createFormData";
import loaderImg from "../../utils/loaderImg";
import Loader from "../global/loader";

export default function ContentBuild({person_fullname, person_firstname, person_id, person_lastname, addDataActivity, editDataActivity, action, setIsBuild, id, title, description, image, links, training_files, trainer_files, time, archive}) {
    let user_id = useSelector(state => state.user).userId
    let user_fullname = useSelector(state => state.user).fullname
    let user_lastname = useSelector(state => state.user).lastname
    let user_firstname = useSelector(state => state.user).firstname
    const acceptFiles = "image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
    const [selectedImage, setSelectedImage] = useState()
    const [preview, setPreview] = useState()
    const [linksValue, setLinksValue] = useState(links || [])
    const [trainingFilesValue, setTrainingFilesValue] = useState(training_files || [])
    const [trainerFilesValue, setTrainerFilesValue] = useState(trainer_files || [])
    const [linkNameValue, setLinkNameValue] = useState()
    const [linkUrlValue, setLinkUrlValue] = useState()
    const [responsibleValue, setResponsibleValue] = useState()
    const [responsibleData, setResponsibleData] = useState([])
    const [isAlert, setIsAlert] = useState(false)
    const [isSubmit, setIsSubmit] = useState(false)

    useEffect(() => {
        if (!selectedImage) {
            setPreview(undefined)
            return
        }

        const objectUrl = URL.createObjectURL(selectedImage?.data)
        setPreview(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [selectedImage])

    const onSelectFile = (e) => {
        let obj = {type: checkFileType(e.target.files[0]), type_real: e.target.files[0].type, name: e.target.files[0].name, size: e.target.files[0].size, data: e.target.files[0]}
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedImage(undefined)
            return
        }
        setSelectedImage(obj)
    }

    const onClickAddLink = () => {
        if (!linkNameValue || !linkUrlValue) {
            alert("Заполните все поля")
            return
        }

        if (linksValue.find(item => item.name === linkNameValue)) {
            alert("Такой ссылки уже есть")
            return
        }

        if (!linkUrlValue.startsWith("http://") && !linkUrlValue.startsWith("https://")) {
            alert("Ссылка должна начинаться с http:// или https://")
            return
        }

        setLinksValue([...linksValue, {name: linkNameValue, url: linkUrlValue}])
        setLinkNameValue("")
        setLinkUrlValue("")
    }

    const onClickRemoveLink = (index) => {
        linksValue.splice(index, 1)
        setLinksValue([...linksValue])
    }

    const onSubmitForm = async (e) => {
        e.preventDefault()
        setIsSubmit(true)
        let img
        let formData = new FormData(e.target)
        let form_data = new FormData();
        try {
            img = selectedImage
        } catch (e) {
            img = image
        }

        let data = {
            action: action,
            data: {
                id: id,
                title: formData.get("title"),
                description: formData.get("description"),
                image: img,
                links: linksValue,
                training_files: trainingFilesValue,
                trainer_files: trainerFilesValue,
                time: formData.get("time"),
                person_id: responsibleData[0]?.id || person_id || user_id,
                person_fullname: responsibleData[0]?.fullname || person_fullname || user_fullname ,
                person_firstname: responsibleData[0]?.firstname || person_firstname || user_firstname,
                person_lastname: responsibleData[0]?.lastname || person_lastname || user_lastname
            }
        }

        await createFormData(form_data, data, "request_data").then(async () => {
            await api("/SaveEduProgram", form_data).then(res => res.data).then(res => {
                if (action === "create"){
                    addDataActivity(res[0])
                }
                if (action === "edit"){
                    editDataActivity(res[0].id, res[0])
                }
            })
        })
        setIsBuild(false)
        setIsSubmit(false)
    }

    const onAddTrainingFile = async (e) => {
        if (!e.target.files[0]) {
            return
        }
        if (e.target.files[0].size > 26214400) {
            setIsAlert(true)
            return
        }
        let obj = {type:checkFileType(e.target.files[0]), data:e.target.files[0], name:e.target.files[0].name, size:e.target.files[0].size, type_real:e.target.files[0].type};
        setTrainingFilesValue([...trainingFilesValue, obj])
    }

    const onAddTrainerFile = async (e) => {
        if (!e.target.files[0]) {
            return
        }
        if (e.target.files[0].size > 26214400) {
            setIsAlert(true)
            return
        }
        let obj = {type:checkFileType(e.target.files[0]), data:e.target.files[0], name:e.target.files[0].name, size:e.target.files[0].size, type_real:e.target.files[0].type};
        setTrainerFilesValue([...trainerFilesValue, obj])
    }

    const onRemoveTrainingFile = (event, index) => {
        event.preventDefault();
        trainingFilesValue.splice(index, 1)
        setTrainingFilesValue([...trainingFilesValue])
    }

    const onRemoveTrainerFile = (event, index) => {
        event.preventDefault();
        trainerFilesValue.splice(index, 1)
        setTrainerFilesValue([...trainerFilesValue])
    }

    const onClickChangeState = async () => {
        await api("/ChangeStateEduProgram", JSON.stringify({id: id, is_archive:!archive})).then(res => res.data).then(res => {
            editDataActivity(res[0].id, res[0], true)
        })
        setIsBuild(false)
    }

    const onChangeSearchResponsible = async (e) => {
        setResponsibleValue(e.target.value)
        if (e.target.value.length >= 3) {
            await api("/GetCollaboratorsForSaveEduProgram", JSON.stringify({
                search: e.target.value
            })).then(res => {
                setResponsibleData(res.data);
            }).catch(err => console.log(err))
        }
    }


    return (
        <div className="content__info">
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
                            Твой файл весит больше 25 Мб. <br/>Пожалуйста, размести его на файловом ресурсе и добавь <br/>ссылку на файл
                        </p>
                    </div>
                </div>
            ) : null}
            <button className="info__cross" onClick={()=>setIsBuild(false)}><Image src={`/assets/images/icons/cross-file.svg`} width={9} height={9} alt=""/></button>
            <div className="info__title">{action === "create" ? "Создание" : "Редактирование"} обучающей активности</div>
                  <form className="info__wrapper" onSubmit={onSubmitForm}>
                      {isSubmit ? <Loader height={1500}/> : (
                        <>
                            <label htmlFor="info__header" className="info__label">Добавить заголовок</label>
                            <input required type="text" id="info__header" placeholder="Не заполнено" className="info__input" defaultValue={title} name="title" />

                            <label htmlFor="info__desc" className="info__label">Добавить описание</label>
                            <textarea id="info__desc" required placeholder="Не заполнено" className="info__textarea" defaultValue={description} name="description" ></textarea>
                            <input type="file" id="info__img" className="info__file" onChange={onSelectFile} required={(!image)} accept="image/jpeg,image/png"/>
                            <label htmlFor="info__img" className="info__file-label">
                                <span className="info__file-text">Выбрать изображение</span>
                                <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt=""
                                       className="info__file-img" width={58} height={53}/>
                            </label>
                            {selectedImage?.data &&  <img src={preview} alt="" className="info__img"/> ||  <img src={image} alt="" className="info__img"/>}

                            <label htmlFor="responsible" className="info__label">Добавить ответственного</label>
                            <input type="text" id="responsible" placeholder="Введите ФИО" list="info__responsible-list" className="info__input" defaultValue={person_fullname || user_fullname} disabled={action === "create"} value={responsibleValue} onChange={onChangeSearchResponsible} required/>
                            <datalist id="info__responsible-list">
                                {responsibleData ? responsibleData.map((coach, index) => {
                                    return <option key={index} value={coach.fullname}>{coach.code}</option>
                                }) : null}
                            </datalist>
                            <label htmlFor="info__time" className="info__label">Длительность активности, мин</label>
                            <input type="number" min="0" required id="info__time" placeholder="30" className="info__input" defaultValue={time} name="time" />

                            <label className="info__label">Дотренинговые материалы</label>
                            <input type="file" id="info__pre-training" className="info__file" accept={acceptFiles}  onChange={onAddTrainingFile}/>
                            <label htmlFor="info__pre-training" className="info__file-label">
                                <span className="info__file-text">Добавить файл</span>
                                <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt="" className="info__file-img" width={58} height={53} />
                            </label>
                            <div className="info__files">
                                {trainingFilesValue ? trainingFilesValue.map((file, index) => {
                                    return (<div className="description__file-block" key={index}>
                                          <a href={file.url || null} target="_blank" rel="noreferrer" className="description__file">
                                              <Image src={`/assets/images/icons/file-${file.type}.svg`} alt="" width={45} height={45}/>
                                          </a>
                                          <button className="description__file-cross" onClick={(e)=>onRemoveTrainingFile(e, index)}><Image src={`/assets/images/icons/cross-file.svg`} width={9} height={9} alt=""/></button></div>
                                    )
                                }) : null}
                            </div>

                            <label htmlFor="info__links" className="info__label">Добавить ссылки</label>
                            <input type="text" id="info__links" placeholder="Введите название" className="info__input" value={linkNameValue} onChange={(e) => setLinkNameValue(e.target.value || undefined) }/>
                            <div className="info__group">
                                <input type="text" placeholder="Введите url" className="info__input" value={linkUrlValue} onChange={(e) => setLinkUrlValue(e.target.value || undefined)}/>
                                <button className="info__btn" onClick={onClickAddLink} type={"button"}>Добавить</button>
                            </div>

                            <div className="info__links-block">
                                {linksValue ? linksValue.map((link, index) => {
                                    return (
                                      <div className="info__links-item" key={index}>
                                          <a href={link.url} className="info__links-text" target="_blank" rel="noreferrer">{link.name}</a>
                                          <button className="info__links-btn" onClick={() => onClickRemoveLink(index)}>Удалить</button>
                                      </div>
                                    )
                                }) : null}
                            </div>

                            <label className="info__label">Материалы для тренера</label>
                            <input type="file" id="info__train" className="info__file" accept={acceptFiles} onChange={onAddTrainerFile}/>
                            <label htmlFor="info__train" className="info__file-label">
                                <span className="info__file-text">Добавить файл</span>
                                <Image loader={loaderImg} src="/assets/images/icons/upload.svg" alt="" className="info__file-img" width={58} height={53}/>
                            </label>
                            <div className="info__files">
                                {trainerFilesValue ? trainerFilesValue.map((file, index) => {
                                    return (<div className="description__file-block" key={index}><a href={file.url || null} className="description__file" target="_blank" rel="noreferrer">
                                        <Image src={`/assets/images/icons/file-${file.type}.svg`} alt="" width={45} height={45}/></a>
                                        <button className="description__file-cross" onClick={(e)=>onRemoveTrainerFile(e, index)}><Image src={`/assets/images/icons/cross-file.svg`} width={9} height={9} alt=""/></button>
                                    </div>)
                                }) : null}
                            </div>
                            <div className="info__btns">
                                <DefaultButton className="info__button info__button-gray" text={archive ? "Действующая" : "В архив"} onClick={onClickChangeState} type={"button"}  disabled={action === "create"}/>
                                <DefaultButton className="info__button" text="Сохранить"/>
                            </div>
                        </>
                      )}

                  </form>
        </div>
    )
}

const checkFileType = (file) => {
    if (file.type === "image/jpeg"){
        return "jpg"
    }
    if (file.type === "image/png"){
        return "png"
    }
    if (file.type === "application/pdf"){
        return "pdf"
    }
    if (file.type.indexOf("word") !== -1){
        return "doc"
    }
    if (file.type.indexOf("excel") !== -1){
        return "excel"
    }
    if (file.type.indexOf("presentation") !== -1){
        return "ppt"
    }
}