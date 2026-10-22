import { LEVELS } from "../lib/model";
import { band } from "../lib/risk";

interface Props {
  title: string;
  grid: number[][];
}

/** 5x5 severity (rows, high at top) by likelihood (columns). Each cell shows how many harms sit there. */
export function RiskMatrix({ title, grid }: Props) {
  const rows = [...LEVELS].reverse();
  return (
    <figure className="matrix">
      <figcaption>{title}</figcaption>
      <table>
        <caption className="sr-only">
          {title}: rows are severity, columns are likelihood, cells count the harms rated there.
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Severity \ Likelihood</span>
            </th>
            {LEVELS.map((l) => (
              <th key={l} scope="col">
                L{l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((sev) => (
            <tr key={sev}>
              <th scope="row">S{sev}</th>
              {LEVELS.map((lik) => {
                const n = grid[sev - 1]?.[lik - 1] ?? 0;
                return (
                  <td key={lik} className={`cell ${band(sev * lik)}`} data-count={n}>
                    {n > 0 ? <span className="count">{n}</span> : <span className="sr-only">0</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
