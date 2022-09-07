export default function ContentSearch({setActivitySearch, setTypeActivity, typeActivity}) {
    return (
        <div className="content__search-block">
            <input type="text"
                   className="search-block__input"
                   placeholder="Поиск по активностям..."
                   onChange={(e) => setActivitySearch(e.target.value)}/>
            <button className="search-block__switch-button" onClick={()=> setTypeActivity(!typeActivity)}>{typeActivity ? "Мои активности" : "Все активности"}</button>
        </div>
    )
}