export default function DefaultButton(props) {
    const className = `${props.className} button` ;
    return (
        <button className={ className } onClick={props.onClick} disabled={props.disabled} type={props.type}>
            {props.text}
        </button>
    )
}