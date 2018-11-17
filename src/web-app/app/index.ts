import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import * as templates from './templates'
import { main } from './templates'

const $ = document.body.querySelector.bind(document.body)
document.body.innerHTML = templates.main()
const mainElement = $('.b4-main')
const alertsElement = $('.b4-alerts')

const showView = async () => {
  const [view, ...params] = window.location.hash.split('/')
  switch (view) {
    case '#welcome':
      mainElement.innerHTML = templates.welcome()
      break
    case '#list-bundles':
      const bundles = await getBundles()
      listBundles(bundles)
      break
    default:
      throw Error(`Unrecognized view: ${view}`)
  }
}

const getBundles = async () => {
  const res = await fetch('/es/book-bundle/bundle/_search?size=100')
  const body = await res.json()
  return body.hits.hits.map(({ _id: id, _source: { name } }) => ({ id, name }))
}

const listBundles = bundles => {
  mainElement.innerHTML = templates.addBundleForm() + templates.listBundles({ bundles })
  const form = $('form')
  form.addEventListener('submit', event => {
    event.preventDefault()
    const name = form.querySelector('input').value
    name && addBundle(name)
  })

  const deleteButtons = mainElement.querySelectorAll('button.delete')
  for (const button of deleteButtons) {
    button.addEventListener('click', () => deleteBundle(button.dataset.bundleId))
  }
}

const showAlert = (message, type = 'danger') => {
  alertsElement.insertAdjacentHTML('beforeend', templates.alert({ type, message }))
}

const addBundle = async (name) => {
  try {
    const bundles = await getBundles()
    const url = `/api/bundle?name=${encodeURIComponent(name)}`
    const res = await (await fetch(url, { method: 'POST' })).json()
    bundles.push({ id: res._id, name })
    listBundles(bundles)
    showAlert(`Bundle "${name}" created!`, 'success')
  } catch (err) {
    showAlert(err)
  }
}

const deleteBundle = async (bundleId) => {
  try {
    const bundles = await getBundles()
    const idx = bundles.findIndex(b => b.id === bundleId)
    const url = `/api/bundle/${bundleId}`
    await fetch(url, { method: 'DELETE' })
    bundles.splice(idx, 1)
    listBundles(bundles)
    showAlert(`Bundle deleted!`, 'success')
  } catch (err) {
    showAlert(err)
  }
}

window.addEventListener('hashchange', showView)
showView().catch(() => window.location.hash = '#welcome')