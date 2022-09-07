export default function FlexTwo(props) {
    const className = `${props.className} wrapper flex-2` ;
    return (
        <div {...props} className={className}>
            {props.children}
        </div>
    )
}