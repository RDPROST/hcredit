import FlexTwo from "../components/global/flexTwo";
import FlexOne from "../components/global/flexOne";
import ScheduleSelect from "../components/select/scheduleSelect";
import {useEffect, useState} from "react";
import Select from "react-select";

export default function Test({api}) {
    const [popupStartDate, setPopupStartDate] = useState("");
    const [popupEndDate, setPopupEndDate] = useState("");
    const [popupStatus, setPopupStatus] = useState("");
    const [data, setData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [coachId, setCoachId] = useState("");
    const onClickSend = () => {
        api("/GetListEvents", JSON.stringify({
            filters: {
                startDate: popupStartDate,
                endDate: popupEndDate,
                status: popupStatus,
                coachId: coachId
            }
        })).then(res => {
            setData(JSON.stringify(res, undefined, 2));
        })
    }

    const onClickClear = () => {
        setPopupStartDate("");
        setPopupEndDate("");
        setPopupStatus("");
        setCoachId("");
    }

    const onChangeMultiSelect = (e) => {
        let coachIds = [];
        e.forEach(item => {
            coachIds.push(item.id);
        })
        setCoachId(coachIds);
    }
    useEffect(() => {
        api("/GetTrainersForEvent", JSON.stringify({null:"null"})).then((res)=>{
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
                <div className="popup-filter">
                    <div className="popup-filter__block">
                        <label className="popup-filter__title management__title" htmlFor="coach">Выбрать тренера</label>
                        <div className="popup-custom__select">
                            <Select
                                isMulti
                                name="coach"
                                options={coachData}
                                onChange={onChangeMultiSelect}
                                placeholder="Не заполнено..."
                            />
                        </div>
                    </div>
                    <div className="popup-filter__block">
                        <label htmlFor="management__date" className="popup-filter__title management__title">Выбрать
                            дату</label>
                        <div className="popup-filter__block-date">
                            <input type="date" id="management__date" className="management__input popup-filter__date"
                                   name="date" value={popupStartDate} onChange={(e)=>setPopupStartDate(e.target.value)}/>
                            <p className="popup-filter__block-dash">
                                –
                            </p>
                            <input type="date" id="management__date" className="management__input popup-filter__date" min={popupStartDate}
                                   name="date" value={popupEndDate} onChange={(e)=>setPopupEndDate(e.target.value)}/>
                        </div>
                    </div>
                    <div className="popup-filter__block">
                        <label className="popup-filter__title management__title" htmlFor="status">Поиск по статусу</label>
                        <select name="coach" id="status" placeholder="test"
                                className="management__select" onChange={(e)=> setPopupStatus(e.target.value)}>
                            <option value="" disabled selected>Не заполнено...</option>
                            <option value="plan">Ожидается</option>
                            <option value="active">В процессе</option>
                            <option value="close">Завершено</option>
                            <option value="cancel">Отменено</option>
                        </select>
                    </div>
                    <div className="popup-filter__block-btns">
                        <button className="button schedule__btn schedule__btn-gray" onClick={onClickClear}>
                            Сбросить
                        </button>
                        <button className="button schedule__btn schedule__btn-mt" onClick={onClickSend}>
                            Найти
                        </button>
                    </div>
                </div>

            </FlexTwo>
            <FlexOne className="white">
                <pre>
                    {data}
                </pre>
            </FlexOne>
        </>
    );
}