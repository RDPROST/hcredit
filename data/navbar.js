// eslint-disable-next-line import/no-anonymous-default-export
export default [
    {
        name: "Интранет портал",
        href: "https://our.homecredit.ru/",
        img: "/assets/images/navbar/homeletter.svg",
        type: "link"
    },
    {
        name: "Управление обучением",
        href: "/management",
        img: "/assets/images/navbar/Icon-staging.svg",
        type: "link"
    },
    {
        name: "Расписание тренера",
        href: "/schedule",
        img: "/assets/images/navbar/Icon-list-ul.svg",
        type: "link"
    },
    // {
    //     name: "Дистанционные курсы",
    //     href: "/",
    //     img: "/assets/images/navbar/Icon-books.svg",
    //     type: "link"
    // },
    // {
    //     name: "Карты развития",
    //     href: "/",
    //     img: "/assets/images/navbar/Icon-box-container.svg",
    //     type: "link"
    // },
    {
        name: "Обучающие активности",
        href: "/activity",
        img: "/assets/images/navbar/Icon-bell-on.svg",
        type: "link"
    },
    // {
    //     name: "Тренерский состав",
    //     href: "/",
    //     img: "/assets/images/navbar/users.svg",
    //     type: "link"
    // },
    {
        name: "Доступные действия",
        type: "title"
    },
    // {
    //     name: "Тест",
    //     href: "/test",
    //     img: "/assets/images/navbar/Icon-live.svg",
    //     type: "link"
    // },
    // {
    //     name: "Все активности",
    //     href: "/",
    //     img: "/assets/images/navbar/Icon-live.svg",
    //     type: "link"
    // },
    {
        name: "Настройка автоназначений",
        href: process.env.NEXT_PUBLIC_HOSTNAME + "/view_doc.html?mode=doc_type&object_id=7115061029214433478#/regular-education",
        img: "/assets/images/navbar/Icon-time.svg",
        type: "link"
    },
    {
        name: "Журнал автоназначений",
        href: process.env.NEXT_PUBLIC_HOSTNAME + "/view_doc.html?mode=doc_type&object_id=7115061029214433478#/education-journal",
        img: "/assets/images/navbar/Icon-date.svg",
        type: "link"
    },
    {
        name: "Настройка уведомлений",
        href: process.env.NEXT_PUBLIC_HOSTNAME + "/view_doc.html?mode=doc_type&object_id=7115061029214433478#/education-push",
        img: "/assets/images/navbar/Icon-warning-full.svg",
        type: "link"
    }
];