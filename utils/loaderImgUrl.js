const myLoader = ({src}) => {
  return `${process.env.NEXT_PUBLIC_HOSTNAME}${src}`
}

export default myLoader