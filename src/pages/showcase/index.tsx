import type { PropsWithChildren } from 'react'

import { Navigate } from '@tanstack/react-router'

import { Button, Card, Dialog } from '@/components'
import { ROUTE_PATH } from '@/constants/route'

const Group = ({ children, title }: PropsWithChildren<{ title: string }>) => {
  return (
    <div className="space-y-2">
      <h4 className="text-text-secondary text-sm font-medium">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export default function ShowcasePage() {
  if (!import.meta.env.DEV) {
    return <Navigate to={ROUTE_PATH.HOME} />
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 p-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-text mb-2 text-3xl font-bold"> Component Showcase</h1>
        <p className="text-text-secondary">A comprehensive demonstration of all components variants and states</p>
      </div>

      <Card title="Button">
        <div className="space-y-8">
          {/* Variants */}
          <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid grid-cols-1 gap-6">
            <Group title="Default Variant">
              <Button variant="default">Default</Button>
              <Button disabled variant="default">
                Disabled
              </Button>
            </Group>
            <Group title="Primary Variant">
              <Button variant="primary">Primary</Button>
              <Button disabled variant="primary">
                Disabled
              </Button>
            </Group>

            <Group title="Secondary Variant">
              <Button variant="secondary">Secondary</Button>
              <Button disabled variant="secondary">
                Disabled
              </Button>
            </Group>

            <Group title="Info Variant">
              <Button variant="info">Info</Button>
              <Button disabled variant="info">
                Disabled
              </Button>
            </Group>

            <Group title="Warning Variant">
              <Button variant="warning">Warning</Button>
              <Button disabled variant="warning">
                Disabled
              </Button>
            </Group>

            <Group title="Success Variant">
              <Button variant="success">Success</Button>
              <Button disabled variant="success">
                Disabled
              </Button>
            </Group>

            <Group title="Error Variant">
              <Button variant="error">Error</Button>
              <Button disabled variant="error">
                Disabled
              </Button>
            </Group>
          </div>

          {/* Sizes */}
          <div className="tablet:grid-cols-3 grid grid-cols-1 gap-6">
            <Group title="Small Size">
              <Button size="small" variant="default">
                Small Default
              </Button>
              <Button size="small" variant="primary">
                Small Primary
              </Button>
              <Button size="small" variant="secondary">
                Small Secondary
              </Button>
            </Group>

            <Group title="Default Size">
              <Button size="default" variant="default">
                Default Size
              </Button>
              <Button size="default" variant="primary">
                Default Primary
              </Button>
              <Button size="default" variant="secondary">
                Default Secondary
              </Button>
            </Group>

            <Group title="Large Size">
              <Button size="large" variant="default">
                Large Default
              </Button>
              <Button size="large" variant="primary">
                Large Primary
              </Button>
              <Button size="large" variant="secondary">
                Large Secondary
              </Button>
            </Group>
          </div>

          {/* Block Buttons */}
          <div className="space-y-4">
            <Group title="Full Width Buttons">
              <Button block variant="default">
                Block Default
              </Button>
              <Button block variant="primary">
                Block Primary
              </Button>
              <Button block variant="secondary">
                Block Secondary
              </Button>
            </Group>
          </div>
        </div>
      </Card>

      <Card title="Dialog">
        <Group title="Sizes">
          <Dialog description="Dialog Description" title="Dialog Title" trigger={<Button>Open Dialog</Button>}>
            <p className="text-body">
              This dialog demonstrates the custom styling that's compatible with your theme. It includes:
            </p>
            <ul className="text-body-sm list-inside list-disc space-y-2">
              <li>Smooth animations and transitions</li>
              <li>Responsive design</li>
              <li>Accessibility features</li>
              <li>Theme-compatible colors and typography</li>
              <li>Backdrop blur effect</li>
              <li>Pure Tailwind CSS implementation</li>
            </ul>
          </Dialog>
          <Dialog
            description="Dialog Description"
            size="small"
            title="Dialog Title"
            trigger={<Button>Open Small Dialog</Button>}
          >
            <p className="text-body">
              This dialog demonstrates the custom styling that's compatible with your theme. It includes:
            </p>
            <ul className="text-body-sm list-inside list-disc space-y-2">
              <li>Smooth animations and transitions</li>
              <li>Responsive design</li>
              <li>Accessibility features</li>
              <li>Theme-compatible colors and typography</li>
              <li>Backdrop blur effect</li>
              <li>Pure Tailwind CSS implementation</li>
            </ul>
          </Dialog>
          <Dialog
            description="Dialog Description"
            size="screen"
            title="Dialog Title"
            trigger={<Button>Open Screen Dialog</Button>}
          >
            <p className="text-body">
              This dialog demonstrates the custom styling that's compatible with your theme. It includes:
            </p>
            <ul className="text-body-sm list-inside list-disc space-y-2">
              <li>Smooth animations and transitions</li>
              <li>Responsive design</li>
              <li>Accessibility features</li>
              <li>Theme-compatible colors and typography</li>
              <li>Backdrop blur effect</li>
              <li>Pure Tailwind CSS implementation</li>
            </ul>
          </Dialog>
        </Group>
      </Card>
    </div>
  )
}
