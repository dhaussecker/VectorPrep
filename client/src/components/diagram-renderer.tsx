interface DiagramElement {
  type: "segment" | "point" | "label";
  from?: [number, number];
  to?: [number, number];
  at?: [number, number];
  open?: boolean;
  text?: string;
  color?: string;
}

export interface DiagramSpec {
  xRange?: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  elements?: DiagramElement[];
}

function niceTicks(min: number, max: number, target = 6): number[] {
  const range = max - min;
  const rawStep = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = rawStep / mag <= 2 ? mag : rawStep / mag <= 5 ? 2 * mag : 5 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + 1e-10; t = Math.round((t + step) * 1e8) / 1e8) {
    ticks.push(t);
  }
  return ticks;
}

export function DiagramRenderer({ spec }: { spec: DiagramSpec }) {
  const SVG_W = 340, SVG_H = 260;
  const MT = 28, MR = 20, MB = 28, ML = 36;
  const plotW = SVG_W - ML - MR;
  const plotH = SVG_H - MT - MB;

  const xRange = spec.xRange ?? [-5, 5];
  const yRange = spec.yRange ?? [-5, 5];

  const px = (x: number) => ML + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotW;
  const py = (y: number) => MT + ((yRange[1] - y) / (yRange[1] - yRange[0])) * plotH;

  const xTicks = niceTicks(xRange[0], xRange[1], 6);
  const yTicks = niceTicks(yRange[0], yRange[1], 5);

  const ox = Math.max(ML, Math.min(ML + plotW, px(0)));
  const oy = Math.max(MT, Math.min(MT + plotH, py(0)));

  return (
    <div className="flex justify-center my-3">
      <svg
        width={SVG_W} height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="border border-border rounded-lg bg-white"
        style={{ maxWidth: "100%" }}
      >
        {xTicks.map(x => (
          <line key={`gx${x}`} x1={px(x)} y1={MT} x2={px(x)} y2={MT + plotH} stroke="#e5e7eb" strokeWidth="0.8" />
        ))}
        {yTicks.map(y => (
          <line key={`gy${y}`} x1={ML} y1={py(y)} x2={ML + plotW} y2={py(y)} stroke="#e5e7eb" strokeWidth="0.8" />
        ))}

        <line x1={ML} y1={oy} x2={ML + plotW} y2={oy} stroke="#374151" strokeWidth="1.5" />
        <polygon points={`${ML + plotW + 6},${oy} ${ML + plotW},${oy - 3.5} ${ML + plotW},${oy + 3.5}`} fill="#374151" />
        <line x1={ox} y1={MT + plotH} x2={ox} y2={MT} stroke="#374151" strokeWidth="1.5" />
        <polygon points={`${ox},${MT - 6} ${ox - 3.5},${MT} ${ox + 3.5},${MT}`} fill="#374151" />

        {xTicks.filter(x => Math.abs(x) > 1e-9).map(x => (
          <text key={`xl${x}`} x={px(x)} y={oy + 13} textAnchor="middle" fontSize="9" fill="#6b7280">{x}</text>
        ))}
        {yTicks.filter(y => Math.abs(y) > 1e-9).map(y => (
          <text key={`yl${y}`} x={ox - 5} y={py(y) + 3} textAnchor="end" fontSize="9" fill="#6b7280">{y}</text>
        ))}

        {spec.xLabel && (
          <text x={ML + plotW + 10} y={oy + 4} fontSize="10" fill="#374151">{spec.xLabel}</text>
        )}
        {spec.yLabel && (
          <text x={ox + 4} y={MT - 10} fontSize="10" fill="#374151">{spec.yLabel}</text>
        )}

        {(spec.elements ?? []).map((el, i) => {
          const color = el.color ?? "#3b9eff";
          if (el.type === "segment" && el.from && el.to) {
            return (
              <line key={i}
                x1={px(el.from[0])} y1={py(el.from[1])}
                x2={px(el.to[0])} y2={py(el.to[1])}
                stroke={color} strokeWidth="2.5" strokeLinecap="round"
              />
            );
          }
          if (el.type === "point" && el.at) {
            const cx = px(el.at[0]), cy = py(el.at[1]);
            return el.open
              ? <circle key={i} cx={cx} cy={cy} r={5} fill="white" stroke={color} strokeWidth="2" />
              : <circle key={i} cx={cx} cy={cy} r={5} fill={color} />;
          }
          if (el.type === "label" && el.at && el.text) {
            return <text key={i} x={px(el.at[0])} y={py(el.at[1])} fontSize="10" fill={color} textAnchor="middle">{el.text}</text>;
          }
          return null;
        })}
      </svg>
    </div>
  );
}
