export default function FlexOne(props) {
    const className = `${props.className} wrapper flex-1` ;
    return (
        <div {...props} className={className}>
            {props.children}
        </div>
    )
}