import { useLocation } from 'react-router-dom'
import { PageHeader } from '../components/ui/Common'
import ScanBox from '../features/dashboard/ScanBox'

function NewScanContent() {
  return (
    <>
      <PageHeader title="New Scan" text="Enter a website URL to check it for accessibility issues." />
      <ScanBox heading="Website to scan" />
    </>
  )
}

export default function NewScan() {
  const location = useLocation()
  return <NewScanContent key={location.key} />
}