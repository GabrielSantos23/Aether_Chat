import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Gallery')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/Gallery"!</div>
}
