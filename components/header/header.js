import FlexOne from "../global/flexOne";
import FlexTwo from "../global/flexTwo";
import Logo from "./logo";
import User from "./user";

export default function Header() {
    return (
        <header className="header">
            <div className="container">
                <FlexOne>
                    <Logo/>
                </FlexOne>
                <FlexTwo/>
                <FlexOne>
                    <User/>
                </FlexOne>
            </div>
        </header>
    )
}