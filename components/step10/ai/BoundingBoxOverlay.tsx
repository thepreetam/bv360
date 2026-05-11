'use client';

interface BoundingBox {
  verification_type: string;
  status: 'pass' | 'flag' | 'fail';
  confidence: number;
  box_2d: [number, number, number, number];
  analysis: string;
}

interface BoundingBoxOverlayProps {
  detections: BoundingBox[];
  imageWidth: number;
  imageHeight: number;
}

function convertBoxToPixels(
  box_2d: [number, number, number, number],
  imageWidth: number,
  imageHeight: number
) {
  const [ymin, xmin, ymax, xmax] = box_2d;
  return {
    x: (xmin / 1000) * imageWidth,
    y: (ymin / 1000) * imageHeight,
    width: ((xmax - xmin) / 1000) * imageWidth,
    height: ((ymax - ymin) / 1000) * imageHeight,
  };
}

function getStatusStyle(status: 'pass' | 'flag' | 'fail') {
  if (status === 'pass') return { color: '#22c55e', dash: 'none' };
  if (status === 'flag') return { color: '#eab308', dash: '5,5' };
  return { color: '#ef4444', dash: 'none' };
}

export function BoundingBoxOverlay({
  detections,
  imageWidth,
  imageHeight,
}: BoundingBoxOverlayProps) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
    >
      {detections.map((detection, i) => {
        const { x, y, width, height } = convertBoxToPixels(
          detection.box_2d,
          imageWidth,
          imageHeight
        );
        const { color, dash } = getStatusStyle(detection.status);

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeDasharray={dash}
              rx={2}
            />
            <text
              x={x}
              y={y > 20 ? y - 6 : y + height + 14}
              fill={color}
              fontSize={Math.max(10, imageWidth * 0.015)}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {detection.verification_type.replace(/_/g, ' ')}{' '}
              ({(detection.confidence * 100).toFixed(0)}%)
            </text>
          </g>
        );
      })}
    </svg>
  );
}