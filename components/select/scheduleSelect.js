import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import api from "../../utils/api";

export default function ScheduleSelect({ status, makers, eventId, setStatusSchedule}) {
    const {userId, role} = useSelector(state => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState();
    const maker = makers.find(maker => Number(maker.id) === Number(userId));
    const [scheduleList, setScheduleList] = useState([
        {
            status: "plan"
        },
        {
            status: "active"
        },
        {
            status: "close"
        },
        {
            status: "cancel"
        }
    ]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "plan":
                return {
                    color: "#315B7C",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D6DBE0"
                }
            case "active":
                return {
                    backgroundColor: "#FDAA5D",
                }
            case "close":
                return {
                    backgroundColor: "#B1C2CF",
                }
            case "cancel":
                return {
                    backgroundColor: "#FF5561",
                }
            default:
                return {
                    backgroundColor: "#FF5561",
                }
        }
    }

    const getStatusName = (status) => {
        switch (status) {
            case "plan":
                return "Ожидается"
            case "active":
                return "В процессе"
            case "close":
                return "Завершено"
            case "cancel":
                return "Отменено"
            default:
                return "Не определено"
        }
    }

    const onClickSelectItem = async (schedule) => {
        setSelectedSchedule(schedule.status);
        setIsOpen(false);
        await api("/ChangeStateEvent", JSON.stringify({
            id: eventId,
            status_id: schedule.status
        })).then(res => {
            setSelectedSchedule(res.data[0].status_id)
            setStatusSchedule(eventId, res.data[0].status_id);
        })
    }

    return (
        <div className="schedule-select__block">
            <div className="schedule-select__wrapper" onClick={() => setIsOpen(!isOpen)} style={getStatusStyle( selectedSchedule || status)}>
                <div className="schedule-select__wrapper-text">
                    <p className="schedule-select__wrapper-text-title">{getStatusName(selectedSchedule || status)}</p>
                </div>
            </div>
            {isOpen && (maker || role === "admin" || role === "methodist")?
                (
                    <div className="schedule-select__list">
                        <div className="schedule-select__wrapper" onClick={() => setIsOpen(!isOpen)} style={getStatusStyle( selectedSchedule || status)}>
                            <div className="schedule-select__wrapper-text">
                                <p className="schedule-select__wrapper-text-title">{getStatusName(selectedSchedule || status)}</p>
                            </div>
                        </div>
                        {scheduleList.map((schedule, index) => {
                            if (schedule.status !== (selectedSchedule || status)) {
                                return (
                                    <div className="schedule-select__list-item" key={index} onClick={() => {
                                        onClickSelectItem(schedule);
                                    }}>
                                        <p className="schedule-select__list-item-title">{getStatusName(schedule.status)}</p>
                                    </div>
                                )
                            }
                        })}
                    </div>
            ) : null}
        </div>
    )

}