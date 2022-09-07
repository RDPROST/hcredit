import ContentItem from "./contentItem";
import {useEffect} from "react";

export default function ContentList({setPage, setTotalPages, activitySearch, typeActivity, data, activity, setActivity, page}) {

    let contentActivities = data.filter(activity => {
        return (activity.title.toLowerCase().includes(activitySearch.toLowerCase()) || activity.person_fullname.toLowerCase().includes(activitySearch.toLowerCase())) && (typeActivity ? Number(activity.type) === Number(typeActivity) : true);
    });

    const setActivityById = id => {
        setActivity(data.find(activity => activity.id === id));
    }

    useEffect(() => {
        setTotalPages(Math.ceil(contentActivities.length / 10));
        setPage(1);
    }, [activitySearch, typeActivity])

    return (
        <div className="content__list-block">
            {contentActivities.slice((page - 1) * 10, page * 10).map(item => {
                return <ContentItem key={item.id} setActivity={setActivityById} active={activity.id === item.id ? ' list-block__item_active' : ''} {...item}/>
            })}
        </div>
    )
}