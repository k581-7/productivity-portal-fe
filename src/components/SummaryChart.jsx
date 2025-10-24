import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const SummaryChart = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="manual_mapping" stroke="#8884d8" name="Manual Mapping" />
          <Line type="monotone" dataKey="auto_mapping" stroke="#82ca9d" name="Auto Mapping" />
          <Line type="monotone" dataKey="created_property" stroke="#ffc658" name="Created Property" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SummaryChart;