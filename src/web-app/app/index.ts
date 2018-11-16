import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import * as templates from './templates'
const $ = document.body.querySelector.bind(document.body)

document.body.innerHTML = templates.main()

const mainElement = $('.b4-main')
const alertsElement = $('.b4-alerts')

mainElement.innerHTML = templates.welcome()
alertsElement.innerHTML = templates.alert({type: 'info', message: 'Handlebars is working!!'})
