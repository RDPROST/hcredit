const myLoader = ({src}) => {
  return `${process.env.NEXT_PUBLIC_HOSTNAME}${process.env.NEXT_PUBLIC_DIR}${src}`
}

export default myLoader