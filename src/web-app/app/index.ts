import '../node_modules/font-awesome/css/font-awesome.min.css'
import '../node_modules/bootstrap-social/bootstrap-social.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import * as templates from './templates'

const $ = document.body.querySelector.bind(document.body)

const fetchJson = async (url, method = 'GET') => {
  try {
    return (await fetch(url, { method, credentials: 'same-origin' })).json()
  } catch (error) {
    return { error }
  }
}

const showView = async () => {
  const [view, ...params] = window.location.hash.split('/')
  switch (view) {
    case '#welcome':
      const mainElement = $('.b4-main')
      const session = await fetchJson('/api/session')
      mainElement.innerHTML = templates.welcome({ session })
      if (session.error) {
        showAlert(session.error)
      }
      break
    case '#list-bundles':
      try {
        const bundles = await getBundles()
        listBundles(bundles)
      } catch (err) {
        showAlert(err)
        window.location.hash = '#welcome'
      }
      break
    default:
      throw Error(`Unrecognized view: ${view}`)
  }
}

const getBundles = async () => {
  const bundles = await fetchJson('/api/list-bundles')
  if (bundles.error) {
    throw bundles.error
  }
  return bundles
}

const listBundles = bundles => {
  const mainElement = $('.b4-main')
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
  const alertsElement = $('.b4-alerts')
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

(async () => {
  const session = await fetchJson('/api/session')
  document.body.innerHTML = templates.main({ session })
  window.addEventListener('hashchange', showView)
  showView().catch(() => window.location.hash = '#welcome')
})()