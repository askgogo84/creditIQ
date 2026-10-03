// Font loading is a Next build transform; rendering tests only need its shape.
export default function localFont() {
  return { className: '', variable: '', style: { fontFamily: '' } }
}
