import { useLatestScan } from '../hooks/useScanData'
import ResultsView from '../features/results/ResultsView'

export default function FixAssistant() {
  const { status, data, retry } = useLatestScan()
  return <ResultsView mode="fix" scan={data} status={status} onRetry={retry} />
}