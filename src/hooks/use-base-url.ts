// import { useEffect, useState } from "react"

// function useBaseUrl() {
//   const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_BASE_URL || '')

//   useEffect(() => {
//           console.log('dddvf', typeof navigator)

//     if (
//       typeof navigator !== 'undefined' &&
//       /iPhone|iPad|iPod/.test(navigator.userAgent) &&
//       !window.MSStream
//     ) {
//       setBaseUrl('http://192.168.1.147:3000')
//     }
//   }, [])

//   return baseUrl
// }

// export default useBaseUrl