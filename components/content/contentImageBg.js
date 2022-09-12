export default function ContentImageBg({img, title, children, bg = false}) {
  return (
    <div className="wrapper__bg-img"
         style={{background: `linear-gradient(to right, rgba(0,0,0,.3), rgba(0,0,0,.3)), url('${ process.env.NEXT_PUBLIC_HOSTNAME}${bg ? process.env.NEXT_PUBLIC_DIR : ""}${img}') no-repeat center / cover`}}>
      <h1 className="wrapper__bg-img-title">{title}</h1>
      {children}
    </div>
  )
}
