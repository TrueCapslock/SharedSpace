import { createFileRoute } from '@tanstack/react-router'
import { RecordModulePage } from '#/features/app/record-module-page'

export const Route = createFileRoute('/app/utilities')({
  component: () => <RecordModulePage moduleKey="utilities" />,
})
