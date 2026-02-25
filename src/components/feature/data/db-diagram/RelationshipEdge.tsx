import type { Edge, EdgeProps } from '@xyflow/react'

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import { useCallback, useState } from 'react'

import type { RelationshipEdgeData, RelationshipType } from '@/types'

export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>

const RELATION_OPTIONS: Array<RelationshipType> = ['1:1', '1:N', 'N:M']

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

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
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
      <BaseEdge id={id} markerEnd={markerEnd} path={edgePath} style={{ ...style, stroke: '#6b7280', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button
            className="text-xs rounded bg-gray-800 px-2 py-0.5 font-bold text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
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
                    opt === data?.relationType ? 'text-blue-400' : 'text-gray-300'
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
