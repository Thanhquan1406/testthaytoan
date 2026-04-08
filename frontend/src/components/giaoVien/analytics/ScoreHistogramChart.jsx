import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';

const ScoreHistogramChart = ({ bins = [] }) => {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '0.9rem', border: '1px solid var(--border-default)', padding: '1rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.8rem', fontSize: '1rem' }}>Phan bo diem (Histogram)</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreHistogramChart;
