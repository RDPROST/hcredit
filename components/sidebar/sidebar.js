import SidebarTitle from "./sidebarTitle";
import SidebarItem from "./sidebarItem";
import sidebarItems from "../../data/navbar";

export default function Sidebar(props) {
    return (
        <nav className="navbar" {...props}>
            <div className="navbar__list">
                {sidebarItems.map((item, index) => {
                    if (item.type === "title") {
                        return (
                            <SidebarTitle key={index} name={item.name}/>
                        )
                    } else {
                        return (
                            <SidebarItem key={index} {...item}/>
                        )
                    }
                })}
            </div>
        </nav>
    )
}