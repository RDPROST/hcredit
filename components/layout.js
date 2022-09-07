import Head from "next/head";
import Header from "./header/header";
import Main from "./main/main";
import {useDispatch, useSelector} from "react-redux";
import {useEffect} from "react";
import {
    SET_USER_ACCESS,
    SET_USER_FIRSTNAME,
    SET_USER_LASTNAME,
    SET_USER_ORG,
    SET_USER_ID,
    SET_USER_AVATAR,
    SET_USER_ROLE,
    SET_USER_SIGNED,
    SET_USER_GENDER,
    SET_USER_FULLNAME
} from "../redux/slices/userSlice";
import {useRouter} from "next/router";
import ErrorPage from "./error";
import FlexTwo from "./global/flexTwo";
import FlexOne from "./global/flexOne";

export default function Layout({children, api}) {
    const dispatch = useDispatch();
    const router = useRouter();
    const {role} = useSelector(state => state.user);

    useEffect(() => {
        const data = async () => {
            return await api("/Init")
                .then(res => res.data)
                .catch(err => console.log(err))
        }
        data().then(data => {
            if (data != null) {
                dispatch(SET_USER_ID(data.userId));
                dispatch(SET_USER_FIRSTNAME(data.firstname));
                dispatch(SET_USER_LASTNAME(data.lastname));
                dispatch(SET_USER_FULLNAME(data.fullname));
                dispatch(SET_USER_ORG(data.org));
                dispatch(SET_USER_AVATAR(data.avatar));

                const dataAccess = JSON.parse(data.access).data;
                dispatch(SET_USER_ACCESS(dataAccess));

                if (dataAccess.isCollaborator) {
                    dispatch(SET_USER_ROLE("student"));
                }
                if (dataAccess.isAdmin) {
                    dispatch(SET_USER_ROLE("admin"));
                }
                if (dataAccess.isMethodist) {
                    dispatch(SET_USER_ROLE("methodist"));
                }
                if (dataAccess.isTrainer) {
                    dispatch(SET_USER_ROLE("trainer"));
                }
                dispatch(SET_USER_GENDER(data.gender))
                dispatch(SET_USER_SIGNED(true));
            }
        })
    }, [])

    return (
        <>
            <Head>
                <title>Document</title>
                <meta charSet="UTF-8"/>
                <meta httpEquiv="X-UA-Compatible" content="ie=edge"/>
                <meta name="viewport"
                      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"/>
            </Head>
            <Header/>
            <Main>
                {((router.pathname === "/activity" || router.pathname === "/management") && role === "student") ? <><FlexTwo className={"white"}><ErrorPage title={"Ошибка"} message={"У вас нет доступа к этой странице"}/></FlexTwo><FlexOne/></> : children}
            </Main>
        </>
    )
}
