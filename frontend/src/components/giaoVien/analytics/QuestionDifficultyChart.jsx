import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';

const QuestionDifficultyChart = ({ data = [] }) => {
  const chartData = data.map((q) => ({
    name: `C${q.thuTu}`,
    tiLeDung: q.tiLeDung,
  }));

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '0.9rem', border: '1px solid var(--border-default)', padding: '1rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.8rem', fontSize: '1rem' }}>Do kho cau hoi (ti le dung %)</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="tiLeDung" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QuestionDifficultyChart;
