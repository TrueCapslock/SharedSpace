import { createFileRoute } from '@tanstack/react-router'
import { RecordModulePage } from '#/features/app/record-module-page'

export const Route = createFileRoute('/app/backlog')({
  component: () => <RecordModulePage moduleKey="backlog" />,
})
