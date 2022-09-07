export default function Loader({height, style, minLoader}) {
    return(
        <div className="loader" style={{height: height, ...style}}>
            <div className="hc-loader" style={minLoader ? {width:50, height:50} :{}}>
                <div style={minLoader ? {width:34, height:34} :{}}></div>
                <div style={minLoader ? {width:34, height:34} :{}}></div>
                <div style={minLoader ? {width:34, height:34} :{}}></div>
                <div style={minLoader ? {width:34, height:34} :{}}></div>
            </div>
        </div>
    )
}