import type { Edge, EdgeProps } from '@xyflow/react'

import { EdgeLabelRenderer, Position, getSmoothStepPath } from '@xyflow/react'
import { useCallback, useState } from 'react'

import type { RelationshipEdgeData, RelationshipType } from '@/types'

export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>

const RELATION_OPTIONS: Array<RelationshipType> = ['1:1', '1:N', 'N:M']

// Handle CSS size is 10px. React Flow connects edges to the handle's outer
// edge, not its center. CSS pixels inside the zoom container equal flow
// units, so the offset from edge to center is a constant 5 — NOT zoom-
// dependent (dividing by zoom causes progressive drift at zoom ≠ 1).
const HANDLE_HALF = 5

export const RelationshipEdgeComponent = ({
  data,
  id,
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<RelationshipEdge>) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourcePosition: Position.Right,
    sourceX: sourceX - HANDLE_HALF,
    sourceY,
    targetPosition: Position.Left,
    targetX: targetX + HANDLE_HALF,
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

  const handleDelete = useCallback(() => {
    setShowDropdown(false)
    window.dispatchEvent(new CustomEvent('db-diagram-edge-delete', { detail: { edgeId: id } }))
  }, [id])

  return (
    <>
      <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Invisible wider path for easier hover detection */}
        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
        {/* Visible edge path */}
        <path
          className="react-flow__edge-path"
          d={edgePath}
          fill="none"
          markerEnd={markerEnd}
          style={{
            opacity: isHovered ? 1 : 0.5,
            stroke: 'var(--color-primary)',
            strokeDasharray: isHovered ? '6 0' : '6 4',
            strokeWidth: 2,
            transition: 'opacity 0.2s ease, stroke-dasharray 0.2s ease',
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            opacity: isHovered ? 1 : 0.8,
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
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
              <button
                className="text-xs block w-full border-t border-gray-700 px-3 py-1 text-error transition-colors hover:bg-gray-700"
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
