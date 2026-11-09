import { Layout } from './components/Layout'
import { useRoute } from './lib/router'
import { Agenda } from './pages/Agenda'
import { Confirmations } from './pages/Confirmations'
import { Dashboard } from './pages/Dashboard'
import { NewAppointment } from './pages/NewAppointment'
import { Patients } from './pages/Patients'

export default function App() {
  const { path, params } = useRoute()
  const key = path + '?' + params.toString()
  let page
  switch (path) {
    case '/agenda': page = <Agenda key={key} params={params} />; break
    case '/pacientes': page = <Patients />; break
    case '/nueva': page = <NewAppointment key={key} params={params} />; break
    case '/confirmaciones': page = <Confirmations />; break
    default: page = <Dashboard />
  }
  return <Layout path={path}>{page}</Layout>
}
