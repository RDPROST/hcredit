import FlexTwo from "../../components/global/flexTwo";
import FlexOne from "../../components/global/flexOne";
import ContentImageBg from "../../components/content/contentImageBg";
import ContentTitle from "../../components/content/contentTitle";
import ContentText from "../../components/content/contentText";
import ContentSearch from "../../components/content/contentSearch";
import {useState,useEffect} from "react";
import {useSelector} from "react-redux";
import ContentList from "../../components/content/contentList";
import Loader from "../../components/global/loader";
import ContentDescription from "../../components/content/contentDescription";
import ContentBuild from "../../components/content/contentBuild";
import DefaultButton from "../../components/button/defaultButton";
import ContentPaginate from "../../components/content/contentPaginate";

export default function Activity({api}) {
    const [activitySearch, setActivitySearch] = useState('');
    const [action, setAction] = useState('');
    const [activity, setActivity] = useState([]);
    const [isBuild, setIsBuild] = useState(false);
    const [typeActivity, setTypeActivity] = useState(false);
    const {role} = useSelector(state => state.user);
    const [dataActivities, setDataActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect( () => {
        const data = async () => {
            return await api("/GetActivities",JSON.stringify({
                role: role,
                type: Number(typeActivity),
            }))
                .then(res => res.data)
                .catch(err => console.log(err))
        }
        data().then(data => {
            if (data != null) {
                setDataActivities(data);
                setActivity(data[0]);
                setIsLoading(false);
            }
        })
    },[])

    const createButton = () => {
        setIsBuild(true);
        setAction("create");
    }

    const setPageHandler = (page) => {
        setPage(page);
    }

    const editDataActivity = (id, data, archive = false) => {
        dataActivities.map(item => {
            if (item.id === id) {
                if (!archive) {
                    item.title = data.title;
                    item.description = data.description;
                    item.image = data.image;
                    item.time = data.time;
                    item.training_files = data.training_files;
                    item.trainer_files = data.trainer_files;
                    item.links = data.links;
                    item.person_id = data.person_id;
                    item.person_lastname = data.person_lastname;
                    item.person_firstname = data.person_firstname;
                } else {
                    item.archive = data.archive;
                }
            }
        })
        setDataActivities([...dataActivities]);
    }

    const addDataActivity = (data) => {
        setDataActivities([data, ...dataActivities]);
    }

    return (
        <>
            <FlexTwo className="white">
                <ContentImageBg img="/assets/images/learn_activity.jpeg" title="Обучающие активности" bg={true}/>
                <ContentTitle/>
                <ContentText/>
                <ContentSearch setActivitySearch={setActivitySearch} setTypeActivity={setTypeActivity} typeActivity={typeActivity}/>
                {isLoading ? <Loader height={500}/> : <ContentList setTotalPages={setTotalPages} setPage={setPageHandler} activitySearch={activitySearch} typeActivity={typeActivity} data={dataActivities} activity={activity} setActivity={setActivity} page={page}/>}
                {dataActivities.length / 10 > 1 ? <ContentPaginate page={page} onPageChange={setPageHandler} totalPages={Math.ceil(totalPages)} visibleLinks={3}/> : null}
                {(role !== "trainer" && (role === "admin" || role === "methodist")) ? <DefaultButton className={"content__button"} text={"Создать"} onClick={ createButton }/> : null}
                {isBuild ? action === "edit" ? <ContentBuild action={action} setIsBuild={setIsBuild} editDataActivity={editDataActivity} addDataActivity={addDataActivity} {...activity}/> : <ContentBuild setIsBuild={setIsBuild} action={action} editDataActivity={editDataActivity} addDataActivity={addDataActivity}/> : null}
            </FlexTwo>
            <FlexOne className={!isBuild ? "white" : ""}>
                {isLoading ? <Loader height={700}/> : !isBuild ? <ContentDescription setAction={setAction} setIsBuild={setIsBuild} {...activity}/> : null}
            </FlexOne>
        </>
    )
}