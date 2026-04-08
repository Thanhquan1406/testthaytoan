import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';

const ClassComparisonChart = ({ data = [] }) => {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '0.9rem', border: '1px solid var(--border-default)', padding: '1rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.8rem', fontSize: '1rem' }}>So sanh ket qua giua cac lop</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tenLop" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg" name="Diem TB" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="passRate" name="Ty le dat (%)" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClassComparisonChart;
