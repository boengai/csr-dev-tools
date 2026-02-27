import type { Edge, EdgeProps } from '@xyflow/react'

import { BaseEdge, EdgeLabelRenderer, Position, getSmoothStepPath, useStore } from '@xyflow/react'
import { useCallback, useState } from 'react'

import type { RelationshipEdgeData, RelationshipType } from '@/types'

export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>

const RELATION_OPTIONS: Array<RelationshipType> = ['1:1', '1:N', 'N:M']

// Handle CSS size is 10px (h-[10px] w-[10px]). React Flow connects edges
// to the handle's edge (not center), so we offset by half the handle size
// in flow coordinates to draw the path to the handle center instead.
const HANDLE_CSS_SIZE = 10

export const RelationshipEdgeComponent = ({
  data,
  id,
  markerEnd,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
}: EdgeProps<RelationshipEdge>) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const zoom = useStore((s) => s.transform[2])
  const halfHandle = HANDLE_CSS_SIZE / (2 * zoom)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourcePosition: Position.Right,
    sourceX: sourceX - halfHandle,
    sourceY,
    targetPosition: Position.Left,
    targetX: targetX + halfHandle,
    targetY,
  })

  const handleRelationChange = useCallback(
    (newType: RelationshipType) => {
      setShowDropdown(false)
      window.dispatchEvent(
        new CustomEvent('db-diagram-relation-change', {
          detail: { edgeId: id, relationType: newType },
        }),
      )
    },
    [id],
  )

  return (
    <>
      <BaseEdge id={id} markerEnd={markerEnd} path={edgePath} style={{ ...style, stroke: 'var(--color-primary)', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button
            className="text-xs rounded bg-black px-2 py-0.5 font-bold text-white transition-colors hover:bg-gray-900"
            data-testid={`edge-label-${id}`}
            onClick={() => setShowDropdown(!showDropdown)}
            type="button"
          >
            {data?.relationType ?? '1:N'}
          </button>
          {showDropdown && (
            <div className="absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded border border-gray-700 bg-gray-800 shadow-lg">
              {RELATION_OPTIONS.map((opt) => (
                <button
                  className={`text-xs block w-full px-3 py-1 transition-colors hover:bg-gray-700 ${
                    opt === data?.relationType ? 'text-primary' : 'text-gray-300'
                  }`}
                  key={opt}
                  onClick={() => handleRelationChange(opt)}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
