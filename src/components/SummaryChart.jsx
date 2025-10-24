import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const SummaryChart = ({ data }) => {
  // Ensure data is an array and has the required format
  const chartData = Array.isArray(data) ? data : [];
  
  console.log('Chart data:', chartData);

  if (chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '400px', minWidth: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
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