import FlexOne from "../global/flexOne";
import Sidebar from "../sidebar/sidebar";

export default function Main({ children }) {
    return (
        <main className="main">
            <div className="container">
                <FlexOne>
                    <Sidebar/>
                </FlexOne>
                {children}
            </div>
        </main>
    )
}