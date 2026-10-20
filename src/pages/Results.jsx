import { useLatestScan } from '../hooks/useScanData'
import ResultsView from '../features/results/ResultsView'

export default function Results() {
  const { status, data, retry } = useLatestScan()
  return <ResultsView mode="results" scan={data} status={status} onRetry={retry} />
}