import { useParams } from 'react-router-dom'
import { useScan } from '../hooks/useScanData'
import ResultsView from '../features/results/ResultsView'

function Content({ id }) {
  const { status, data, retry } = useScan(id)
  return <ResultsView mode="results" scan={data} status={status} onRetry={retry} />
}

export default function ResultsById() {
  const { id } = useParams()
  return <Content key={id} id={id} />
}