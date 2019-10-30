import "@babel/polyfill"
import {ROOT_URL} from './ServiceUtils'

const apiRoot = `${ROOT_URL}/image-banks`

export async function list() {
  const res = await fetch(`${apiRoot}`)
  if(res.status > 299) throw new Error(await res.text())
  return res.json()
}
export async function search(name, query) {
  const res = await fetch(`${apiRoot}/${name}/?query=${query}`)
  if(res.status > 299) throw new Error(await res.text())
  return res.json()
}
export async function random(name) {
  const res = await fetch(`${apiRoot}/${name}/random`)
  if(res.status > 299) throw new Error(await res.text())
  return res.json()
}

